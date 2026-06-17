import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { prompt } = await request.json();

  // TODO: Integrate with a real AI narrative provider (e.g., DeepSeek, Claude)
  // For now, reject with a setup error.
  return NextResponse.json(
    { error: "No AI narrative provider is configured. Go to Admin → AI narrative / script providers to connect and activate one." },
    { status: 400 }
  );
}
