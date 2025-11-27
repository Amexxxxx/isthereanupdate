import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Missing OpenAI API Key' }, { status: 500 });
  }

  try {
    const { message, game, version, description, lastUpdated } = await request.json();

    // Basic input sanitization
    if (!message || typeof message !== 'string' || message.length > 500) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    const systemPrompt = `You are a helpful assistant for a game update tracker website.
    The user is asking about the "${game}" update.
    
    Context:
    - Game: ${game}
    - Current Version: ${version}
    - Last Updated Date: ${lastUpdated}
    - Brief Description: ${description}
    
    Your goal is to answer the user's question about this specific update.
    If they ask for more details than what is in the brief description, you can use your general knowledge about the game's recent updates (up to your knowledge cutoff) or infer from the version number if possible.
    If you don't know specific details about a very recent patch that isn't in your training data, just explain what typically happens in updates for this game or elaborate on the provided description.
    Keep answers concise (under 3-4 sentences) and friendly.`;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      model: "gpt-4o-mini",
    });

    const reply = completion.choices[0].message.content;

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}

