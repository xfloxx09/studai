"use client";
import { useState } from "react";
import { Card, SectionLabel, Pill, Btn, TextField } from './shared';

/* ───────────────────────── provider catalog (mock defaults) ───────────────────────── */

const initialScrapers = [
  { id: "ensembledata", name: "EnsembleData", note: "Multi-platform (TikTok+IG+YT+FB), unit pricing", cost: "$100–$1,400/mo · 50 free units/day", connected: true, active: true },
  { id: "apify", name: "Apify", note: "Actor marketplace, pay-per-result", cost: "$1.70–$2.30 / 1,000 results", connected: true, active: false },
  { id: "tikhub", name: "TikHub", note: "TikTok-focused, pure pay-as-you-go", cost: "$0.001 / request", connected: false, active: false },
  { id: "lamatok", name: "Lamatok", note: "TikTok-specialized, cheapest per-request", cost: "$0.0006 / request · 100 free", connected: false, active: false },
  { id: "scrapecreators", name: "ScrapeCreators", note: "One-time pack option, no subscription", cost: "$47–$497 one-time, or PAYG", connected: false, active: false },
];

const initialVideoGen = [
  { id: "kling", name: "Kling AI", note: "Best cost-to-quality, native audio add-on", cost: "from $0.13/sec · $10–$37/mo plans", connected: true, active: true },
  { id: "hailuo", name: "Hailuo (MiniMax)", note: "Lowest cost-per-finished-clip", cost: "~$0.30 per 10s 1080p clip", connected: true, active: false },
  { id: "seedance", name: "Seedance 2.0 (via fal.ai)", note: "Highest volume per dollar, audio included", cost: "$0.20/sec @720p w/ audio", connected: false, active: false },
  { id: "pika", name: "Pika", note: "Cheapest entry subscription", cost: "$8/mo · 5s default clips", connected: false, active: false },
  { id: "runway", name: "Runway Gen-4", note: "Premium fidelity & control", cost: "$0.10–$0.25/sec", connected: false, active: false },
];

const initialNarrative = [
  { id: "deepseek", name: "DeepSeek V4 Flash", note: "Cheapest frontier-tier model, 5M free tokens on signup", cost: "$0.14/M in · $0.28/M out", connected: true, active: true },
  { id: "claude", name: "Claude Sonnet 4.6", note: "Highest quality narrative & script writing", cost: "premium tier — best for final scripts", connected: true, active: false },
  { id: "qwen", name: "Qwen (via OpenRouter)", note: "Open-weight alternative, similar pricing tier to DeepSeek", cost: "~$0.15–$0.30/M tokens", connected: false, active: false },
  { id: "gpt4o", name: "OpenAI GPT-4o", note: "Fallback / comparison model", cost: "mid-tier pricing", connected: false, active: false },
];

const initialPublish = [
  { id: "tiktok", name: "TikTok", note: "Content Posting API — free, requires app audit for public posting", connected: false },
  { id: "instagram", name: "Instagram", note: "Meta Graph API — free, requires Business account + App Review", connected: false },
  { id: "facebook", name: "Facebook", note: "Meta Graph API — shares App Review with Instagram", connected: false },
  { id: "youtube", name: "YouTube", note: "YouTube Data API v3 — free quota, OAuth2 required", connected: false },
];

/* ───────────────────────── Provider row ───────────────────────── */

function ProviderRow({ p, onSetActive, onToggleConnect }: any) {
  const [key, setKey] = useState("");
  const [editing, setEditing] = useState(false);
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#E0E0F0" }}>{p.name}</span>
            {p.active && <Pill color="#FFB800" bg="#FFB80018" border="#FFB80033">active</Pill>}
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.connected ? "#4CAF50" : "#3A3A50", display: "inline-block" }} />
          </div>
          <div style={{ fontSize: 11, color: "#50508A", marginTop: 4, lineHeight: 1.5 }}>{p.note}</div>
          <div style={{ fontSize: 11, color: "#7060A0", marginTop: 3, fontFamily: "monospace" }}>{p.cost}</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {p.connected && !p.active && <Btn small onClick={() => onSetActive(p.id)}>Set active</Btn>}
          <Btn small onClick={() => setEditing(e => !e)}>{p.connected ? "Edit key" : "Connect"}</Btn>
        </div>
      </div>
      {editing && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #15152A" }}>
          <TextField label="API key" value={key} onChange={setKey} placeholder="sk-••••••••••••••••" type="password" mono />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn small primary onClick={() => { onToggleConnect(p.id, true); setEditing(false); setKey(""); }}>Save & test connection</Btn>
            {p.connected && <Btn small onClick={() => { onToggleConnect(p.id, false); setEditing(false); }}>Disconnect</Btn>}
          </div>
        </div>
      )}
    </Card>
  );
}

function ProviderCategory({ title, hint, providers, setProviders }: any) {
  const setActive = (id: string) => setProviders((prev: any[]) => prev.map((p: any) => ({ ...p, active: p.id === id })));
  const toggleConnect = (id: string, val: boolean) => setProviders((prev: any[]) => prev.map((p: any) => p.id === id ? { ...p, connected: val, active: val ? p.active : false } : p));
  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>{title}</SectionLabel>
      <div style={{ fontSize: 11, color: "#40406A", marginBottom: 12, lineHeight: 1.6 }}>{hint}</div>
      {providers.map((p: any) => <ProviderRow key={p.id} p={p} onSetActive={setActive} onToggleConnect={toggleConnect} />)}
    </div>
  );
}

/* ───────────────────────── Publish row ───────────────────────── */

function PublishRow({ p, onToggle }: any) {
  const [showForm, setShowForm] = useState(false);
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#E0E0F0" }}>{p.name}</span>
            <Pill color={p.connected ? "#4CAF50" : "#6A6A90"} bg={p.connected ? "#4CAF5018" : "transparent"} border={p.connected ? "#4CAF5033" : "#1E1E36"}>
              {p.connected ? "connected" : "not connected"}
            </Pill>
          </div>
          <div style={{ fontSize: 11, color: "#50508A", marginTop: 4 }}>{p.note}</div>
        </div>
        <Btn small primary={!p.connected} onClick={() => setShowForm(s => !s)}>{p.connected ? "Manage" : "Connect"}</Btn>
      </div>
      {showForm && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #15152A" }}>
          <TextField label="Client ID / App ID" value="" onChange={() => {}} placeholder="App credentials from developer console" mono />
          <TextField label="Client secret" value="" onChange={() => {}} placeholder="••••••••••••••••" type="password" mono />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn small primary onClick={() => { onToggle(p.id, true); setShowForm(false); }}>Authorize via OAuth ↗</Btn>
            {p.connected && <Btn small onClick={() => { onToggle(p.id, false); setShowForm(false); }}>Revoke</Btn>}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ───────────────────────── Admin main ───────────────────────── */

export default function Admin(props: any) {
  const [scrapers, setScrapers] = useState(initialScrapers);
  const [videoGen, setVideoGen] = useState(initialVideoGen);
  const [narrative, setNarrative] = useState(initialNarrative);
  const [publishConnections, setPublishConnections] = useState(initialPublish);

  const togglePublish = (id: string, val: boolean) =>
    setPublishConnections((prev: any[]) => prev.map((p: any) => p.id === id ? { ...p, connected: val } : p));

  return (
    <div>
      <div style={{ fontSize: 11, color: "#40406A", marginBottom: 20, lineHeight: 1.7 }}>
        Connect multiple providers per category and switch the active one anytime — no code changes, no re-entering keys for providers you've already connected.
      </div>

      <ProviderCategory title="Scraping providers" hint="Source of trending video data per platform. Switch providers if one gets rate-limited, raises prices, or drops coverage."
        providers={scrapers} setProviders={setScrapers} />

      <ProviderCategory title="Video generation providers" hint="Used if the studio generates supplementary clips, b-roll, or AI avatars rather than filming live."
        providers={videoGen} setProviders={setVideoGen} />

      <ProviderCategory title="AI narrative / script providers" hint="Builds the cross-video narrative and writes scripts, captions, and hooks. DeepSeek is set active by default for lowest cost."
        providers={narrative} setProviders={setNarrative} />

      <div>
        <SectionLabel>Direct publishing connections</SectionLabel>
        <div style={{ fontSize: 11, color: "#40406A", marginBottom: 12, lineHeight: 1.6 }}>
          OAuth credentials so the studio can upload directly to each platform from the Publish step.
        </div>
        {publishConnections.map((p: any) => <PublishRow key={p.id} p={p} onToggle={togglePublish} />)}
      </div>
    </div>
  );
}
