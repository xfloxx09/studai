import { NextResponse } from 'next/server';

const TOPIC_BANK = [
  "POV reaction to unexpected plot twist", "Quick 3-ingredient recipe hack", "Gym form correction breakdown",
  "Relationship red flag countdown", "Money-saving grocery trick", "Before/after room transformation",
  "Unboxing a surprise package", "Day in the life of a night-shift nurse", "AI tool nobody is talking about yet",
  "Storytime: awkward first date", "Pet doing something unexpectedly smart", "Life hack using everyday objects",
  "Rating the most hyped fast food item", "Breaking down a viral conspiracy claim", "Outfit transition trend remix",
];

function mockVideoUrl(platform: string, idStr: string) {
  switch (platform) {
    case "tiktok": return `https://www.tiktok.com/@creator/video/7${idStr}`;
    case "instagram": return `https://www.instagram.com/reel/${idStr}/`;
    case "facebook": return `https://www.facebook.com/reel/${idStr}`;
    case "youtube": return `https://www.youtube.com/shorts/${idStr}`;
    default: return "#";
  }
}

function genMockScrape(platform: string, freshness: string) {
  const maxMin = { "1h": 60, "6h": 360, "24h": 1440, "72h": 4320 }[freshness] || 1440;
  const n = 6;
  return Array.from({ length: n }, (_, i) => {
    const ageMin = Math.floor(Math.random() * maxMin * 0.9) + 5;
    const ageLabel = ageMin < 60 ? `${ageMin}m ago` : ageMin < 1440 ? `${Math.floor(ageMin / 60)}h ago` : `${Math.floor(ageMin / 1440)}d ago`;
    const recencyBoost = Math.max(0, 30 - Math.floor(ageMin / 20));
    const score = Math.min(99, 52 + recencyBoost + Math.floor(Math.random() * 18));
    const views = Math.floor((score / 100) * 9000000 + Math.random() * 500000);
    const idStr = Math.random().toString(36).slice(2, 12);
    return {
      id: `${platform}-${i}-${Date.now()}`,
      platform,
      title: TOPIC_BANK[Math.floor(Math.random() * TOPIC_BANK.length)],
      url: mockVideoUrl(platform, idStr),
      ageLabel,
      ageMin,
      score,
      views,
      likes: Math.floor(views * (0.04 + Math.random() * 0.06)),
      comments: Math.floor(views * (0.002 + Math.random() * 0.004)),
    };
  }).sort((a, b) => b.score - a.score);
}

export async function POST(request: Request) {
  const { platforms, freshness } = await request.json();
  
  // In production, this would call the scraping API based on the active provider
  const results = (platforms as string[]).flatMap(p => genMockScrape(p, freshness));
  
  return NextResponse.json({ results: results.sort((a, b) => b.score - a.score) });
}
