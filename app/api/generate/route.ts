import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

const PROVIDER_MODELS: Record<string, { apiUrl: string; model: string }> = {
  deepseek: { apiUrl: "https://api.deepseek.com/v1/chat/completions", model: "deepseek-chat" },
};

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const activeProvider = await prisma.providerConfig.findFirst({
      where: { category: "narrative", active: true, connected: true },
    });

    if (!activeProvider) {
      return NextResponse.json(
        { error: "No AI narrative provider is configured. Go to Admin → AI narrative / script providers to connect and activate one." },
        { status: 400 }
      );
    }

    if (!activeProvider.apiKey) {
      return NextResponse.json(
        { error: `${activeProvider.name} is set as active but has no API key saved.` },
        { status: 400 }
      );
    }

    const modelInfo = PROVIDER_MODELS[activeProvider.id];
    if (!modelInfo) {
      return NextResponse.json(
        { error: `"${activeProvider.name}" is not yet integrated as a narrative provider.` },
        { status: 501 }
      );
    }

    const resp = await fetch(modelInfo.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${activeProvider.apiKey}`,
      },
      body: JSON.stringify({
        model: modelInfo.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return NextResponse.json(
        { error: `${activeProvider.name} API error (${resp.status}): ${txt}` },
        { status: 502 }
      );
    }

    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      return NextResponse.json({ error: "AI returned an empty response" }, { status: 502 });
    }

    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Generation failed" }, { status: 500 });
  }
}
