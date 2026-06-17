import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function POST(request: Request) {
  const { platforms, freshness } = await request.json();

  // TODO: Integrate with a real scraping provider (e.g., EnsembleData, Apify, TikHub)
  // For now, reject with a setup error.
  return NextResponse.json(
    { error: "No scraping provider is configured. Go to Admin → Scraping providers to connect and activate one." },
    { status: 400 }
  );
}
