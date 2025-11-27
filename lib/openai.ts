import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export interface UpdateInfo {
  version: string;
  date: string;
  summary: string;
  isNewer: boolean;
}

export async function parseGameUpdate(
  gameName: string, 
  htmlContent: string, 
  existingVersion: string
): Promise<{ data: UpdateInfo | null; error?: string; raw?: string }> {
  const today = new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });

    const systemPrompt = `You are an expert game update tracker. Your goal is to identify the **LATEST** patch notes or update information available in the provided text.
    
    **Context:**
    - Current Date: ${today}
    - Last Known Version/Status: "${existingVersion}"
    
    **Instructions:**
    1. Search the text for keywords like "Patch Notes", "Update", "Hotfix", "Version", "Release", "Latest Update".
    2. **CRITICAL FILTERING STEP:** Identify the most recent update that has **ALREADY BEEN RELEASED**.
       - Compare dates against "Current Date": ${today}.
       - **DISCARD** any entries labeled "Upcoming", "Future", "Leaks", or "Planned".
       - **DISCARD** any entries with dates in the future (e.g. if today is Nov 27, discard Nov 29).
       - Select the highest version number from the REMAINING (released) entries.
    3. **Extract the specific version number.**
       - Look for patterns like "27.0.2", "v32.10", "1.5.3", "Patch 11.2".
       - Look for patterns like "27.0.2", "v32.10", "1.5.3", "Patch 11.2".
       - If the title says "Apex Legends: Latest Update 27.0.2", the version is "27.0.2".
       - If the title says "Update 1.5", the version is "1.5".
       - Do NOT return generic titles like "Season Update", "November Update", or "Matchmaking Test".
       - ONLY if NO numerical version (X.X or X.X.X) is found in the entire text for the latest entry, fall back to "Update [Month] [Day]".
    4. Extract the release date.
    5. Write a short 1-2 sentence summary of the key changes.
    6. Compare this found update with the "Last Known Version".
        - If the extracted version/date is DIFFERENT and NEWER than the known one, set "isNewer" to true.
        - If the known version is "Checking..." or "Pending", always set "isNewer" to true.
        - If the extracted data matches the known version, set "isNewer" to false.

    **Output Format:**
    Return ONLY a raw JSON object (no markdown formatting) with this structure:
    {
      "version": "string (e.g. '27.0.2', 'v32.11')",
      "date": "string (e.g. November 19, 2025)",
      "summary": "string (e.g. 'This update introduces the new map and weapon balancing.')",
      "isNewer": boolean
    }`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here is the content scraped from the ${gameName} news page. find the latest numerical version:\n\n${htmlContent.substring(0, 20000)}` }
      ],
      model: "gpt-4o-mini", // Cost-effective and fast
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const data = JSON.parse(content);
    return { data };

  } catch (error: any) {
    console.error(`OpenAI parsing failed for ${gameName}:`, error);

    // FALLBACK: Regex-based parsing if AI fails
    console.log(`Attempting regex fallback for ${gameName}...`);
    try {
      const versionMatch = htmlContent.match(/v?(\d+\.\d+(\.\d+)?)|Patch\s+(\d+\.\d+)/i);
      const dateMatch = htmlContent.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i);
      
      if (versionMatch) {
        const foundVersion = versionMatch[0];
        const foundDate = dateMatch ? dateMatch[0] : new Date().toLocaleDateString();
        
        return {
          data: {
            version: foundVersion,
            date: foundDate,
            summary: `Latest update detected automatically (AI unavailable).`,
            isNewer: foundVersion !== existingVersion
          },
          error: `OpenAI failed, used fallback. Error: ${error.message}`
        };
      }
    } catch (fallbackError) {
      console.error("Fallback parsing failed:", fallbackError);
    }

    return { data: null, error: error.message || "OpenAI Error" };
  }
}

