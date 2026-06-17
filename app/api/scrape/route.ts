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

let idCounter = 0;
function nextId() { return `v${++idCounter}`; }

async function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const timer = setTimeout(() => {
      if (signal?.aborted) reject(new DOMException("Aborted", "AbortError"));
      else resolve();
    }, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    }, { once: true });
  });
}

async function runApifyActor(apiKey: string, actorId: string, input: any, signal?: AbortSignal): Promise<any[]> {
  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), 120000);
  const onAbort = () => { clearTimeout(timeout); ac.abort(); };
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    const runResp = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: ac.signal,
      }
    );
    clearTimeout(timeout);

    if (!runResp.ok) {
      const txt = await runResp.text();
      throw new Error(`Apify run start failed (${runResp.status}): ${txt}`);
    }

    const runData = await runResp.json();
    const runId = runData.data?.id;
    if (!runId) throw new Error("Apify did not return a run id");

    let status = "RUNNING";
    while (status === "RUNNING" || status === "READY") {
      signal?.throwIfAborted();
      await sleep(3000, signal);
      const statusResp = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`,
        { signal: ac.signal }
      );
      if (statusResp.ok) {
        const statusData = await statusResp.json();
        status = statusData.data?.status || "FAILED";
      }
    }

    signal?.throwIfAborted();

    if (status !== "SUCCEEDED") {
      throw new Error(`Apify run ended with status: ${status}`);
    }

    const itemsResp = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apiKey}&format=json`,
      { signal: ac.signal }
    );
    if (!itemsResp.ok) {
      const txt = await itemsResp.text();
      throw new Error(`Apify dataset fetch failed (${itemsResp.status}): ${txt}`);
    }
    return await itemsResp.json();
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", onAbort);
  }
}

async function scrapeWithApify(apiKey: string, platforms: string[], signal?: AbortSignal): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];

  if (platforms.includes("tiktok")) {
    // Use khadinakbar/tiktok-trending-videos-scraper which has well-documented field names
    const items = await runApifyActor(apiKey, "khadinakbar~tiktok-trending-videos-scraper", {
      maxResults: 50,
      countryCode: "US",
    }, signal);

    for (const item of (items || [])) {
      const desc = item.description || item.title || item.videoDesc || "Untitled";
      const playCount = item.playCount ?? item.plays ?? 0;
      const likeCount = item.likeCount ?? item.likes ?? 0;
      const commentCount = item.commentCount ?? item.comments ?? 0;
      const shareCount = item.shareCount ?? item.shares ?? 0;
      const authorName = item.authorHandle || item.authorUniqueId || item.authorName || "unknown";
      const videoId = item.videoId || item.id || nextId();
      const score = Math.min(100, Math.round(
        (Math.log10(Math.max(playCount, 1)) / 8) * 40 +
        (Math.log10(Math.max(likeCount, 1)) / 7) * 30 +
        (Math.log10(Math.max(commentCount, 1)) / 5) * 20 +
        (Math.log10(Math.max(shareCount, 1)) / 4) * 10
      ));

      results.push({
        id: `tk-${videoId}`,
        title: desc.slice(0, 200),
        url: item.videoUrl || item.item_url || `https://www.tiktok.com/@${authorName}/video/${videoId}`,
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
    const { platforms } = await request.json();

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
      const results = await scrapeWithApify(activeProvider.apiKey, platforms, request.signal);
      return NextResponse.json(results);
    }

    return NextResponse.json(
      { error: `Scraping via "${activeProvider.name}" is not yet implemented. Switch to Apify in Admin.` },
      { status: 501 }
    );
  } catch (e: any) {
    if (e.name === "AbortError") {
      return NextResponse.json({ error: "Scrape cancelled" }, { status: 499 });
    }
    return NextResponse.json({ error: e?.message || "Scrape failed" }, { status: 500 });
  }
}
