"use client";
import { useState, useEffect, useRef } from "react";
import { PLATFORMS, FRESHNESS, scoreStyle, Card, SectionLabel, Pill, Btn, TextField, Skeleton } from './shared';

/* ───────────────────────── Step 1 Scrape ───────────────────────── */

function StepScrape({ platforms, setPlatforms, freshness, setFreshness, scraped, setScraped, selected, setSelected, scanning, setScanning, onContinue }: any) {
  const abortRef = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState(0);

  const togglePlatform = (id: string) => setPlatforms((prev: string[]) => prev.includes(id) ? prev.filter((p: string) => p !== id) : [...prev, id]);
  const toggleSelect = (item: any) => setSelected((prev: any[]) => prev.find((i: any) => i.id === item.id) ? prev.filter((i: any) => i.id !== item.id) : [...prev, item]);

  const cancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
  };

  const runScrape = async () => {
    setScanning(true);
    setScraped([]);
    setSelected([]);
    setProgress(0);

    const ac = new AbortController();
    abortRef.current = ac;

    // animate progress bar
    const prog = setInterval(() => setProgress(p => Math.min(p + 2, 92)), 800);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platforms, freshness }),
        signal: ac.signal,
      });
      clearInterval(prog);
      setProgress(100);
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Scrape failed");
        setScanning(false);
        return;
      }
      setScraped(data);
    } catch (e: any) {
      clearInterval(prog);
      if (e.name === "AbortError") {
        alert("Scrape cancelled");
      } else {
        console.error("Scrape API failed", e);
        alert("Could not reach the scrape API. Make sure the backend is running.");
      }
    }
    setScanning(false);
    abortRef.current = null;
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {PLATFORMS.map(p => {
            const on = platforms.includes(p.id);
            return (
              <button key={p.id} onClick={() => togglePlatform(p.id)} style={{
                padding: "4px 12px", borderRadius: 20, cursor: "pointer",
                border: `1px solid ${on ? p.color + "88" : "#1E1E36"}`,
                background: on ? p.color + "18" : "transparent", color: on ? p.color : "#40406A",
                fontSize: 11, fontWeight: 700,
              }}>{p.label}</button>
            );
          })}
        </div>
        <div style={{ width: 1, height: 18, background: "#1A1A2E" }} />
        <div style={{ display: "flex", gap: 4 }}>
          {FRESHNESS.map(f => {
            const on = freshness === f.id;
            return (
              <button key={f.id} onClick={() => setFreshness(f.id)} style={{
                padding: "4px 10px", borderRadius: 5, cursor: "pointer",
                border: `1px solid ${on ? "#7B3FE066" : "#1E1E36"}`,
                background: on ? "#7B3FE018" : "transparent", color: on ? "#A875FF" : "#40406A",
                fontSize: 11, fontWeight: 700,
              }}>{f.label}</button>
            );
          })}
        </div>
        {scanning ? (
          <div style={{ display: "flex", gap: 8, marginLeft: "auto", alignItems: "center" }}>
            <Btn small onClick={cancel}>Cancel</Btn>
            <span style={{ fontSize: 11, color: "#7070A0" }}>{progress}%</span>
          </div>
        ) : (
          <Btn primary style={{ marginLeft: "auto" }} disabled={platforms.length === 0} onClick={runScrape}>
            ⚡ Scrape now
          </Btn>
        )}
      </div>

      {scanning && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ height: 4, background: "#15152A", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${progress}%`, borderRadius: 2,
              background: "linear-gradient(90deg,#7B3FE0,#FF3B5C)",
              transition: "width 0.3s ease",
            }} />
          </div>
          <div style={{ fontSize: 11, color: "#50508A", marginTop: 6 }}>
            Scraping trending videos…
          </div>
        </div>
      )}

      {scanning && Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <Skeleton w="55%" /><Skeleton w="14%" />
          </div>
          <Skeleton h={9} w="30%" />
        </Card>
      ))}

      {!scanning && scraped.length === 0 && (
        <div style={{ textAlign: "center", padding: "46px 12px", color: "#25253A" }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>📡</div>
          <div style={{ fontSize: 12, lineHeight: 1.7 }}>No scrape run yet — pick platforms and freshness window, then scrape</div>
        </div>
      )}

      {scraped.map((item: any) => {
        const sc = scoreStyle(item.score);
        const isSel = !!selected.find((i: any) => i.id === item.id);
        const plat = PLATFORMS.find(p => p.id === item.platform);
        return (
          <Card key={item.id} onClick={() => toggleSelect(item)} selected={isSel}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <input type="checkbox" checked={isSel} onChange={() => {}} style={{ marginTop: 3, accentColor: "#7B3FE0" }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5, gap: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#E0E0F0" }}>{item.title}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{
                      padding: "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                      color: "#60A0E0", background: "#60A0E018", border: "1px solid #60A0E033", textDecoration: "none",
                    }}>↗ Open</a>
                    <Pill color={sc.color} bg={sc.bg} border={sc.border}>🔥 {item.score}</Pill>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#50508A" }}>
                  <span style={{ color: plat?.color }}>{plat?.label}</span>
                  <span>{item.ageLabel}</span>
                  <span>{item.views}</span>
                  <span>{item.likes}</span>
                  <span>{item.comments}</span>
                </div>
              </div>
            </div>
          </Card>
        );
      })}

      {scraped.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <Btn primary disabled={selected.length === 0} onClick={onContinue}>
            Build narrative from {selected.length} selected →
          </Btn>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Step 2 Create ───────────────────────── */

function StepCreate({ selected, options, setOptions, generating, setGenerating, chosen, setChosen, activeNarrativeModel, onContinue }: any) {
  const buildNarrative = async () => {
    setGenerating(true);
    setOptions(null);
    setChosen(null);
    try {
      const list = selected.map((s: any) => `- [${s.platform}] "${s.title}" — score ${s.score}, ${s.views} views, ${s.ageLabel}`).join("\n");
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `You are a viral short-form video strategist. Below are scraped viral videos from the studio's trend scan:\n\n${list}\n\nStep 1: Write a short narrative (3-4 sentences) connecting the common thread across these viral videos — what emotional or structural pattern is making them work right now.\n\nStep 2: Based on that narrative, propose exactly 3 distinct, original concepts the studio could film next. Each must be different in angle, format, or emotion. Do not copy any single source video — synthesize a new original idea inspired by the pattern.\n\nRespond ONLY with raw JSON, no markdown:\n{\n  "narrative": "the 3-4 sentence synthesis",\n  "options": [\n    {"id":"opt1","title":"Concept title","angle":"one-line description of the unique angle","hook":"first 3-second spoken hook, under 14 words","format":"short label e.g. POV / Tutorial / Storytime / Reaction","whyItWorks":"one sentence on why this should perform well"}\n  ]\n}\nExactly 3 items in options.`
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Generation failed");
        setGenerating(false);
        return;
      }
      setOptions(JSON.parse(data.text));
    } catch (e) {
      console.error("Generation API failed", e);
      alert("Could not reach the generate API. Configure an AI narrative provider in Admin.");
    }
    setGenerating(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: "#40406A" }}>
          {selected.length} source videos selected · narrative model: <span style={{ color: "#A875FF", fontWeight: 700 }}>{activeNarrativeModel}</span>
        </div>
        <Btn primary small onClick={buildNarrative} disabled={generating}>{generating ? "Synthesizing…" : "↻ Build narrative"}</Btn>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {selected.map((s: any) => (
          <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" style={{
            display: "flex", alignItems: "center", gap: 5, textDecoration: "none",
            padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
            color: "#7090C0", background: "#0E0E1C", border: "1px solid #1A1A2E",
          }}>
            {s.title.length > 28 ? s.title.slice(0, 28) + "…" : s.title}
            <span style={{ color: "#40406A" }}>↗</span>
          </a>
        ))}
      </div>

      {!options && !generating && (
        <div style={{ textAlign: "center", padding: "46px 12px", color: "#25253A" }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>🧠</div>
          <div style={{ fontSize: 12, lineHeight: 1.7 }}>Click "Build narrative" to synthesize your scraped videos into 3 concept options</div>
        </div>
      )}

      {generating && (
        <div>
          <Card><Skeleton h={10} w="90%" /><div style={{ height: 6 }} /><Skeleton h={10} w="70%" /></Card>
          {[0, 1, 2].map(i => <Card key={i}><Skeleton h={11} w="50%" /><div style={{ height: 8 }} /><Skeleton h={9} w="85%" /></Card>)}
        </div>
      )}

      {options && !generating && (
        <div>
          <Card accent="#7B3FE033">
            <SectionLabel>🧠 Cross-video narrative</SectionLabel>
            <div style={{ fontSize: 12, color: "#8080B0", lineHeight: 1.7 }}>{options.narrative}</div>
          </Card>

          <div style={{ fontSize: 10, color: "#40406A", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", margin: "16px 0 8px" }}>
            Choose one concept to produce
          </div>

          {options.options.map((opt: any) => {
            const isSel = chosen?.id === opt.id;
            return (
              <Card key={opt.id} onClick={() => setChosen(opt)} selected={isSel}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#E0E0F0" }}>{opt.title}</div>
                  <Pill color="#A875FF" bg="#7B3FE018" border="#7B3FE033">{opt.format}</Pill>
                </div>
                <div style={{ fontSize: 11, color: "#50508A", marginBottom: 7 }}>{opt.angle}</div>
                <div style={{ padding: "6px 10px", background: "#06060F", borderRadius: 6, fontSize: 11, color: "#9060E0", fontStyle: "italic", marginBottom: 7 }}>
                  "{opt.hook}"
                </div>
                <div style={{ fontSize: 11, color: "#40406A" }}>💡 {opt.whyItWorks}</div>
              </Card>
            );
          })}

          {chosen && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <Btn primary onClick={onContinue}>Continue with "{chosen.title}" →</Btn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Step 3 Edit ───────────────────────── */

function StepEdit({ chosen, fields, setFields, onContinue }: any) {
  const update = (k: string, v: any) => setFields((prev: any) => ({ ...prev, [k]: v }));
  return (
    <div>
      <Card accent="#7B3FE033">
        <SectionLabel>Producing</SectionLabel>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#E0E0F0" }}>{chosen?.title}</div>
        <div style={{ fontSize: 11, color: "#50508A", marginTop: 4 }}>{chosen?.angle}</div>
      </Card>

      <Card>
        <SectionLabel>Title</SectionLabel>
        <TextField value={fields.title} onChange={(v: string) => update("title", v)} placeholder="Video title" />
        <SectionLabel>Description</SectionLabel>
        <textarea value={fields.description} onChange={e => update("description", e.target.value)} rows={4} style={{
          width: "100%", background: "#06060F", border: "1px solid #1A1A2E", borderRadius: 6,
          padding: "8px 11px", color: "#D0D0F0", fontSize: 12, resize: "vertical",
        }} />
        <div style={{ height: 12 }} />
        <SectionLabel>Hashtags</SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {fields.hashtags.map((h: string, i: number) => (
            <span key={i} style={{ background: "#15152A", color: "#9090C0", padding: "3px 9px", borderRadius: 20, fontSize: 11, display: "flex", gap: 6, alignItems: "center" }}>
              #{h}
              <span onClick={() => update("hashtags", fields.hashtags.filter((_: string, idx: number) => idx !== i))} style={{ cursor: "pointer", color: "#60607A" }}>×</span>
            </span>
          ))}
        </div>
        <input placeholder="Type a tag and press enter" onKeyDown={e => {
          if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
            update("hashtags", [...fields.hashtags, (e.target as HTMLInputElement).value.trim().replace(/^#/, "")]);
            (e.target as HTMLInputElement).value = "";
          }
        }} style={{ width: "100%", background: "#06060F", border: "1px solid #1A1A2E", borderRadius: 6, padding: "7px 11px", color: "#D0D0F0", fontSize: 12 }} />
      </Card>

      <Card>
        <SectionLabel color="#FFB800">CTA / comment bait</SectionLabel>
        <TextField value={fields.cta} onChange={(v: string) => update("cta", v)} placeholder="Question or directive to drive comments" />
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
        <Btn primary onClick={onContinue}>Continue to publish →</Btn>
      </div>
    </div>
  );
}

/* ───────────────────────── Step 4 Publish ───────────────────────── */

function StepPublish({ fields, targets, setTargets, status, setStatus, schedule, setSchedule }: any) {
  const toggleTarget = (id: string) => setTargets((prev: string[]) => prev.includes(id) ? prev.filter((p: string) => p !== id) : [...prev, id]);

  const publish = async () => {
    const st: any = {};
    targets.forEach((id: string) => { st[id] = "queued"; });
    setStatus(st);

    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields, targets, schedule }),
      });
      const data = await res.json();
      if (res.ok) {
        targets.forEach((id: string) => {
          setTimeout(() => setStatus((prev: any) => ({ ...prev, [id]: "published" })), 900);
        });
      } else {
        alert(data.error || "Publish failed");
        setStatus({});
      }
    } catch (e) {
      console.error("Publish failed", e);
      alert("Publish API call failed.");
      setStatus({});
    }
  };

  return (
    <div>
      <Card>
        <SectionLabel>Preview</SectionLabel>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#E0E0F0", marginBottom: 4 }}>{fields.title || "Untitled"}</div>
        <div style={{ fontSize: 11, color: "#50508A", marginBottom: 8 }}>{fields.description}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {fields.hashtags.map((h: string, i: number) => <Pill key={i} color="#7090C0" border="#1E1E36">#{h}</Pill>)}
        </div>
      </Card>

      <SectionLabel>Publish to</SectionLabel>
      {PLATFORMS.map(p => {
        const isTarget = targets.includes(p.id);
        const st = status[p.id];
        return (
          <Card key={p.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" checked={isTarget} onChange={() => toggleTarget(p.id)} style={{ accentColor: p.color }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#E0E0F0" }}>{p.label}</span>
              </div>
              {st === "queued" && <Pill color="#FFB800" bg="#FFB80018" border="#FFB80033">queued</Pill>}
              {st === "published" && <Pill color="#4CAF50" bg="#4CAF5018" border="#4CAF5033">published ✓</Pill>}
            </div>
          </Card>
        );
      })}

      <Card>
        <SectionLabel>Schedule</SectionLabel>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn small primary={schedule === "now"} onClick={() => setSchedule("now")}>Publish now</Btn>
          <Btn small primary={schedule === "later"} onClick={() => setSchedule("later")}>Schedule for later</Btn>
        </div>
        {schedule === "later" && <div style={{ marginTop: 10 }}><TextField type="datetime-local" value="" onChange={() => {}} /></div>}
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn primary disabled={targets.length === 0} onClick={publish}>
          {schedule === "later" ? "Schedule post" : "Publish now"}
        </Btn>
      </div>
    </div>
  );
}

/* ───────────────────────── Studio main ───────────────────────── */

const STEPS = ["Scrape", "Create", "Edit & manage", "Publish"];

export default function Studio() {
  const [step, setStep] = useState(0);
  const [platforms, setPlatforms] = useState<string[]>(["tiktok", "instagram"]);
  const [freshness, setFreshness] = useState("24h");
  const [scraped, setScraped] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [selected, setSelected] = useState<any[]>([]);
  const [options, setOptions] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [chosen, setChosen] = useState<any>(null);
  const [fields, setFields] = useState<{ title: string; description: string; hashtags: string[]; cta: string }>({ title: "", description: "", hashtags: [], cta: "" });
  const [targets, setTargets] = useState<string[]>([]);
  const [status, setStatus] = useState<any>({});
  const [schedule, setSchedule] = useState("now");
  const [publishConnections, setPublishConnections] = useState<any[]>([]);

  const activeNarrativeModel = "DeepSeek V4 Flash";

  useEffect(() => {
    fetch("/api/admin/providers")
      .then(r => r.json())
      .then(data => setPublishConnections(data.filter((p: any) => p.category === "publish")))
      .catch(() => {});
  }, []);

  const goToEdit = () => {
    setFields({
      title: chosen.title,
      description: `${chosen.angle} ${chosen.hook}`,
      hashtags: [],
      cta: "",
    });
    setStep(2);
  };

  return (
    <div>
      <div style={{ display: "flex", borderBottom: "1px solid #15152A", background: "#09091A", marginBottom: 18 }}>
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => i <= step ? setStep(i) : null}
            style={{
              flex: 1, padding: "12px 8px", border: "none", background: "transparent", cursor: i <= step ? "pointer" : "default",
              borderBottom: `2px solid ${i === step ? "#7B3FE0" : "transparent"}`,
              color: i === step ? "#E0E0F0" : i < step ? "#7070A0" : "#2A2A40",
              fontSize: 12, fontWeight: 700,
            }}>
            <span style={{ marginRight: 6 }}>{i + 1}</span>{s}
          </button>
        ))}
      </div>

      {step === 0 && (
        <StepScrape
          platforms={platforms} setPlatforms={setPlatforms}
          freshness={freshness} setFreshness={setFreshness}
          scraped={scraped} setScraped={setScraped}
          selected={selected} setSelected={setSelected}
          scanning={scanning} setScanning={setScanning}
          onContinue={() => setStep(1)}
        />
      )}
      {step === 1 && (
        <StepCreate
          selected={selected}
          options={options} setOptions={setOptions}
          generating={generating} setGenerating={setGenerating}
          chosen={chosen} setChosen={setChosen}
          activeNarrativeModel={activeNarrativeModel}
          onContinue={goToEdit}
        />
      )}
      {step === 2 && (
        <StepEdit
          chosen={chosen}
          fields={fields} setFields={setFields}
          onContinue={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <StepPublish
          fields={fields}
          targets={targets} setTargets={setTargets}
          status={status} setStatus={setStatus}
          schedule={schedule} setSchedule={setSchedule}
        />
      )}
    </div>
  );
}
