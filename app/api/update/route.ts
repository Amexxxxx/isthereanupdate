import { NextResponse } from 'next/server';
import { getGames, saveGames, GameData } from '@/lib/store';
import { fetchSiteContent } from '@/lib/scraper';
import { parseGameUpdate } from '@/lib/openai';

export async function GET(request: Request) {
  const logs: string[] = [];
  const log = (msg: string) => {
    console.log(msg);
    logs.push(msg);
  };

  // Verify Cron Secret (Skip in development for manual testing)
  if (process.env.NODE_ENV !== 'development') {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ 
      error: 'Missing OPENAI_API_KEY', 
      message: 'Please add your OpenAI API Key to .env.local' 
    }, { status: 500 });
  }

  try {
    const games = await getGames();
    const updates: string[] = [];

    for (const game of games) {
      const url = game.sources[0].url; // Use first source for now
      if (!url || url === "#") continue;

      log(`Checking updates for ${game.name}...`);
      const content = await fetchSiteContent(url);
      
      if (content) {
        log(`Fetched content for ${game.name} (${content.length} chars), analyzing...`);
        const result = await parseGameUpdate(game.name, content, game.version);
        
        if (result.data) {
          const analysis = result.data;
          const isFirstRun = game.version === "Checking...";
          
          if (analysis.isNewer || isFirstRun) {
            log(`Update found for ${game.name}: ${analysis.version}`);
            game.version = analysis.version || game.version;
            game.lastUpdated = analysis.date || game.lastUpdated;
            game.description = analysis.summary || game.description;
            updates.push(game.name);
          } else {
            log(`No new update for ${game.name} (Current: ${game.version})`);
          }
        } else {
          log(`Failed to parse data for ${game.name}`);
          if (result.error) log(`Error: ${result.error}`);
          if (result.raw) log(`Raw Response (First 100 chars): ${result.raw.substring(0, 100)}...`);
        }
      } else {
        log(`Failed to fetch content for ${game.name}`);
      }
    }

    if (updates.length > 0) {
      await saveGames(games);
      log(`Saved updates for: ${updates.join(', ')}`);
    } else {
      log("No updates found.");
    }

    return NextResponse.json({ 
      success: true, 
      updated: updates,
      logs: logs,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal Server Error",
      logs: logs
    }, { status: 500 });
  }
}
