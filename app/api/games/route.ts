import { NextResponse } from 'next/server';
import { getGames } from '@/lib/store';

export async function GET() {
  const games = await getGames();
  return NextResponse.json(games);
}

