import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

const DEFAULTS = [
  // Scrapers
  { id: "ensembledata", category: "scraper", name: "EnsembleData", note: "Multi-platform (TikTok+IG+YT+FB), unit pricing", cost: "$100–$1,400/mo · 50 free units/day", connected: false, active: false },
  { id: "apify", category: "scraper", name: "Apify", note: "Actor marketplace, pay-per-result", cost: "$1.70–$2.30 / 1,000 results", connected: false, active: false },
  { id: "tikhub", category: "scraper", name: "TikHub", note: "TikTok-focused, pure pay-as-you-go", cost: "$0.001 / request", connected: false, active: false },
  { id: "lamatok", category: "scraper", name: "Lamatok", note: "TikTok-specialized, cheapest per-request", cost: "$0.0006 / request · 100 free", connected: false, active: false },
  { id: "scrapecreators", category: "scraper", name: "ScrapeCreators", note: "One-time pack option, no subscription", cost: "$47–$497 one-time, or PAYG", connected: false, active: false },
  // Video generation
  { id: "kling", category: "video-gen", name: "Kling AI", note: "Best cost-to-quality, native audio add-on", cost: "from $0.13/sec · $10–$37/mo plans", connected: false, active: false },
  { id: "hailuo", category: "video-gen", name: "Hailuo (MiniMax)", note: "Lowest cost-per-finished-clip", cost: "~$0.30 per 10s 1080p clip", connected: false, active: false },
  { id: "seedance", category: "video-gen", name: "Seedance 2.0 (via fal.ai)", note: "Highest volume per dollar, audio included", cost: "$0.20/sec @720p w/ audio", connected: false, active: false },
  { id: "pika", category: "video-gen", name: "Pika", note: "Cheapest entry subscription", cost: "$8/mo · 5s default clips", connected: false, active: false },
  { id: "runway", category: "video-gen", name: "Runway Gen-4", note: "Premium fidelity & control", cost: "$0.10–$0.25/sec", connected: false, active: false },
  // Narrative
  { id: "deepseek", category: "narrative", name: "DeepSeek V4 Flash", note: "Cheapest frontier-tier model, 5M free tokens on signup", cost: "$0.14/M in · $0.28/M out", connected: false, active: false },
  { id: "claude", category: "narrative", name: "Claude Sonnet 4.6", note: "Highest quality narrative & script writing", cost: "premium tier — best for final scripts", connected: false, active: false },
  { id: "qwen", category: "narrative", name: "Qwen (via OpenRouter)", note: "Open-weight alternative, similar pricing tier to DeepSeek", cost: "~$0.15–$0.30/M tokens", connected: false, active: false },
  { id: "gpt4o", category: "narrative", name: "OpenAI GPT-4o", note: "Fallback / comparison model", cost: "mid-tier pricing", connected: false, active: false },
  // Publish
  { id: "tiktok", category: "publish", name: "TikTok", note: "Content Posting API — free, requires app audit for public posting", connected: false, active: false },
  { id: "instagram", category: "publish", name: "Instagram", note: "Meta Graph API — free, requires Business account + App Review", connected: false, active: false },
  { id: "facebook", category: "publish", name: "Facebook", note: "Meta Graph API — shares App Review with Instagram", connected: false, active: false },
  { id: "youtube", category: "publish", name: "YouTube", note: "YouTube Data API v3 — free quota, OAuth2 required", connected: false, active: false },
];

export async function GET() {
  let configs = await prisma.providerConfig.findMany();

  if (configs.length === 0) {
    await prisma.providerConfig.createMany({ data: DEFAULTS });
    configs = await prisma.providerConfig.findMany();
  }

  return NextResponse.json(configs);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, ...fields } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing provider id" }, { status: 400 });
  }

  // If setting this provider active, deactivate others in the same category
  if (fields.active === true) {
    const existing = await prisma.providerConfig.findUnique({ where: { id } });
    if (existing) {
      await prisma.providerConfig.updateMany({
        where: { category: existing.category, active: true },
        data: { active: false },
      });
    }
  }

  const updated = await prisma.providerConfig.upsert({
    where: { id },
    update: fields,
    create: { id, ...fields },
  });

  return NextResponse.json(updated);
}
