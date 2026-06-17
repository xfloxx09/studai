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
  createdAt: string | null;
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
    signal?.addEventListener("abort", () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); }, { once: true });
  });
}

async function runApifyActor(apiKey: string, actorId: string, input: any, signal?: AbortSignal): Promise<any[]> {
  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), 300000);
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

    if (!runResp.ok) {
      const txt = await runResp.text();
      throw new Error(`Apify run start failed (${runResp.status}): ${txt}`);
    }

    const runData = await runResp.json();
    const runId = runData.data?.id;
    if (!runId) throw new Error("Apify did not return a run id");

    let status = "RUNNING";
    let pollAttempts = 0;
    while (status === "RUNNING" || status === "READY") {
      signal?.throwIfAborted();
      await sleep(1500, signal);
      if (++pollAttempts > 120) {
        throw new Error("Apify run timed out — no status change after 3 minutes");
      }
      const statusResp = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`,
        { signal: ac.signal }
      );
      if (statusResp.ok) {
        const statusData = await statusResp.json();
        status = statusData.data?.status || "FAILED";
      } else {
        status = "FAILED";
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

function computeScore(play: number, likes: number, comments: number, shares: number): number {
  return Math.min(100, Math.round(
    (Math.log10(Math.max(play, 1)) / 8) * 40 +
    (Math.log10(Math.max(likes, 1)) / 7) * 30 +
    (Math.log10(Math.max(comments, 1)) / 5) * 20 +
    (Math.log10(Math.max(shares, 1)) / 4) * 10
  ));
}

const FRESHNESS_MS: Record<string, number> = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "72h": 72 * 60 * 60 * 1000,
};

function getCutoff(freshness?: string): Date | null {
  if (!freshness) return null;
  const ms = FRESHNESS_MS[freshness];
  if (!ms) return null;
  return new Date(Date.now() - ms);
}

async function scrapeTikTok(apiKey: string, cutoff?: Date | null, signal?: AbortSignal): Promise<ScrapedItem[]> {
  const items = await runApifyActor(apiKey, "khadinakbar~tiktok-trending-videos-scraper", {
    maxResults: 15, countryCode: "US",
  }, signal);

  return (items || []).map((item: any) => {
      const desc = String(item.description || item.title || "Untitled");
      const play = item.playCount ?? item.plays ?? 0;
      const likes = item.likeCount ?? item.likes ?? 0;
      const comments = item.commentCount ?? item.comments ?? 0;
      const shares = item.shareCount ?? item.shares ?? 0;
      const author = String(item.authorHandle || item.authorUniqueId || "unknown");
      const vid = item.videoId || item.id || nextId();
      return {
        id: `tk-${vid}`, title: desc.slice(0, 200),
        url: item.videoUrl || item.item_url || `https://www.tiktok.com/@${author}/video/${vid}`,
        platform: "tiktok", score: computeScore(play, likes, comments, shares),
        ageLabel: "trending", views: fmt(play), likes: fmt(likes), comments: fmt(comments),
        createdAt: item.createTime || null,
      };
    });
}

async function scrapeInstagram(apiKey: string, cutoff?: Date | null, signal?: AbortSignal): Promise<ScrapedItem[]> {
  const items = await runApifyActor(apiKey, "iron-crawler~instagram-search-reels", {
    query: "trending", maxPages: 1,
  }, signal);

  return (items || [])
    .map((item: any) => {
      const desc = String(item.caption || item.description || "Untitled");
      const play = item.view_count ?? item.playCount ?? 0;
      const likes = item.like_count ?? item.likes ?? 0;
      const comments = item.comment_count ?? item.comments ?? 0;
      const shares = item.share_count ?? item.shares ?? 0;
      const author = String(item.username || "unknown");
      const vid = item.reel_id || item.id || nextId();
      return {
        id: `ig-${vid}`, title: desc.slice(0, 200),
        url: item.video_url || item.url || `https://www.instagram.com/reel/${vid}/`,
        platform: "instagram", score: computeScore(play, likes, comments, shares),
        ageLabel: "trending", views: fmt(play), likes: fmt(likes), comments: fmt(comments),
        createdAt: null,
      };
    });
}

async function scrapeYouTube(apiKey: string, cutoff?: Date | null, signal?: AbortSignal): Promise<ScrapedItem[]> {
  const sinceStr = cutoff ? cutoff.toISOString().split("T")[0] : "";
  const items = await runApifyActor(apiKey, "celebrated-quadraphonic~youtube-shorts-scraper", {
    mode: "channel", extraMode: "trending", trendingCountry: "US",
    maxResults: 15, sortBy: "NEWEST", since: sinceStr,
    includeChannelInfo: false,
  }, signal);

  return (items || []).map((item: any) => {
      const desc = String(item.title || item.description || "Untitled");
      const play = item.view_count ?? item.views ?? 0;
      const likes = item.like_count ?? item.likes ?? 0;
      const comments = item.comment_count ?? item.comments ?? 0;
      const shares = item.share_count ?? item.shares ?? 0;
      const author = String(item.channel_name || item.channelName || "unknown");
      const vid = item.id || nextId();
      return {
        id: `yt-${vid}`, title: desc.slice(0, 200),
        url: item.url || `https://youtube.com/shorts/${vid}`,
        platform: "youtube", score: computeScore(play, likes, comments, shares),
        ageLabel: "trending", views: fmt(play), likes: fmt(likes), comments: fmt(comments),
        createdAt: item.publish_date || null,
      };
    });
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

const PROVIDER_PLATFORMS: Record<string, string[]> = {
  apify: ["tiktok", "instagram", "youtube"],
  ensembledata: ["tiktok", "instagram", "youtube", "facebook"],
};

const PLATFORM_SCRAPERS: Record<string, (apiKey: string, cutoff?: Date | null, signal?: AbortSignal) => Promise<ScrapedItem[]>> = {
  tiktok: scrapeTikTok,
  instagram: scrapeInstagram,
  youtube: scrapeYouTube,
};

export async function POST(request: Request) {
  try {
    const { platforms, freshness } = await request.json();
    const cutoff = getCutoff(freshness);

    const activeProvider = await prisma.providerConfig.findFirst({
      where: { category: "scraper", active: true, connected: true },
    });

    if (!activeProvider) {
      return NextResponse.json(
        { error: "No scraping provider is configured. Go to Admin → Scraping providers to connect and activate one." },
        { status: 400 }
      );
    }

    const supported = PROVIDER_PLATFORMS[activeProvider.id] || [];
    const unsupported = platforms.filter((p: string) => !supported.includes(p));
    if (unsupported.length > 0) {
      return NextResponse.json({
        error: `"${activeProvider.name}" only supports: ${supported.join(", ")}. Unsupported: ${unsupported.join(", ")}.`,
      }, { status: 400 });
    }

    if (activeProvider.id === "apify") {
      if (!activeProvider.apiKey) {
        return NextResponse.json({ error: "Apify is set as active but has no API key saved." }, { status: 400 });
      }

      const toScrape = platforms.filter((p: string) => PLATFORM_SCRAPERS[p]);
      if (toScrape.length === 0) {
        return NextResponse.json({ error: "No scraper available for the selected platforms." }, { status: 400 });
      }

      const results = await Promise.all(
        toScrape.map((p: string) => PLATFORM_SCRAPERS[p](activeProvider.apiKey!, cutoff, request.signal))
      );

      return NextResponse.json(results.flat());
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
