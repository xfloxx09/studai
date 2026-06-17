import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

type ScrapedItem = {
  id: string;
  title: string;
  url: string;
  platform: string;
  score: number;
  ageLabel: string;
  views: string;
  likes: string;
  comments: string;
};

async function scrapeWithApify(apiKey: string, platforms: string[]): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];

  if (platforms.includes("tiktok")) {
    const resp = await fetch(
      `https://api.apify.com/v2/acts/sentry~tiktok-trending/run-sync-get-dataset-items?token=${apiKey}&waitForFinish=60`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }
    );
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Apify actor run failed (${resp.status}): ${txt}`);
    }
    const items = await resp.json();

    for (const item of (items || [])) {
      const desc = item.video_description || item.description || item.text || item.title || "Untitled";
      const playCount = item.play_count ?? item.stats?.playCount ?? 0;
      const likeCount = item.digg_count ?? item.stats?.diggCount ?? 0;
      const commentCount = item.comment_count ?? item.stats?.commentCount ?? 0;
      const shareCount = item.share_count ?? item.stats?.shareCount ?? 0;
      const authorName = item.author?.unique_id || item.authorName || "unknown";
      const videoId = item.id || item.video_id || crypto.randomUUID();
      const score = Math.min(100, Math.round(
        (Math.log10(Math.max(playCount, 1)) / 8) * 40 +
        (Math.log10(Math.max(likeCount, 1)) / 7) * 30 +
        (Math.log10(Math.max(commentCount, 1)) / 5) * 20 +
        (Math.log10(Math.max(shareCount, 1)) / 4) * 10
      ));

      results.push({
        id: `apify-${videoId}`,
        title: desc.slice(0, 200),
        url: item.video_url || item.url || item.videoUrl || `https://www.tiktok.com/@${authorName}/video/${videoId}`,
        platform: "tiktok",
        score,
        ageLabel: "trending",
        views: formatCount(playCount),
        likes: formatCount(likeCount),
        comments: formatCount(commentCount),
      });
    }
  }

  return results;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export async function POST(request: Request) {
  try {
    const { platforms, freshness } = await request.json();

    const activeProvider = await prisma.providerConfig.findFirst({
      where: { category: "scraper", active: true, connected: true },
    });

    if (!activeProvider) {
      return NextResponse.json(
        { error: "No scraping provider is configured. Go to Admin → Scraping providers to connect and activate one." },
        { status: 400 }
      );
    }

    if (activeProvider.id === "apify") {
      if (!activeProvider.apiKey) {
        return NextResponse.json(
          { error: "Apify is set as active but has no API key saved." },
          { status: 400 }
        );
      }
      const results = await scrapeWithApify(activeProvider.apiKey, platforms);
      return NextResponse.json(results);
    }

    return NextResponse.json(
      { error: `Scraping via "${activeProvider.name}" is not yet implemented. Switch to Apify in Admin.` },
      { status: 501 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Scrape failed" }, { status: 500 });
  }
}
