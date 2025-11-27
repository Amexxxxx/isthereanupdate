import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'games.json');

export interface GameData {
  name: string;
  accentColor: string;
  version: string;
  lastUpdated: string;
  description: string;
  sources: { name: string; url: string }[];
}

const DEFAULT_DATA: GameData[] = [
  {
    name: "Fortnite",
    accentColor: "blue",
    version: "Checking...",
    lastUpdated: "Pending",
    description: "Fetching latest data...",
    sources: [
      { name: "fortnite.com", url: "https://www.fortnite.com/news" }
    ]
  },
  {
    name: "Valorant",
    accentColor: "red",
    version: "11.10",
    lastUpdated: "November 11, 2025",
    description: "The absolute latest current live game client version for Valorant is Patch 11.10...",
    sources: [
      { name: "playvalorant.com", url: "https://playvalorant.com/en-us/news/" }
    ]
  },
  {
    name: "Rust",
    accentColor: "orange",
    version: "Checking...",
    lastUpdated: "Pending",
    description: "Fetching latest data...",
    sources: [
      { name: "rust.facepunch.com", url: "https://rust.facepunch.com/news/" }
    ]
  },
  {
    name: "Apex Legends",
    accentColor: "red",
    version: "23.1.0",
    lastUpdated: "November 21, 2025",
    description: "Apex Legends latest patch introduces the new 'Ignite' event...",
    sources: [
      { name: "ea.com", url: "https://www.ea.com/games/apex-legends/news" }
    ]
  }
];

export async function getGames(): Promise<GameData[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, create it with default data
    await saveGames(DEFAULT_DATA);
    return DEFAULT_DATA;
  }
}

export async function saveGames(games: GameData[]): Promise<void> {
  const dir = path.dirname(DATA_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
  await fs.writeFile(DATA_FILE, JSON.stringify(games, null, 2));
}

