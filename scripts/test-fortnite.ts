import { fetchSiteContent } from '../lib/scraper';

async function testFortnite() {
  const url = "https://www.fortzone.gg/updates";
  console.log(`Fetching ${url}...`);
  
  try {
    const content = await fetchSiteContent(url);
    console.log("--- Content Start (First 2000 chars) ---");
    console.log(content.substring(0, 2000));
    console.log("--- Content End ---");
    console.log(`Total length: ${content.length}`);
  } catch (error) {
    console.error("Fetch failed:", error);
  }
}

testFortnite();

