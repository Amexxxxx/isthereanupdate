import * as cheerio from 'cheerio';

async function fetchSiteContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    $('script').remove();
    $('style').remove();
    $('nav').remove();
    $('footer').remove();
    $('header').remove();

    return $('body').text().replace(/\s+/g, ' ').trim().substring(0, 25000);
  } catch (error) {
    return "";
  }
}

async function testFetch() {
  const url = "https://store.steampowered.com/feeds/news/app/1172470/?cc=US&l=english";
  console.log(`Fetching ${url}...`);
  
  try {
    const content = await fetchSiteContent(url);
    console.log("--- Content Start ---");
    console.log(content.substring(0, 1000));
    console.log("--- Content End ---");
    console.log(`Total length: ${content.length}`);
  } catch (error) {
    console.error("Fetch failed:", error);
  }
}

testFetch();

