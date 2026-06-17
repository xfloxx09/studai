"use client";
import { useState, useEffect } from "react";
import { Card, SectionLabel, Pill, Btn, TextField } from './shared';

/* ───────────────────────── Provider row ───────────────────────── */

function ProviderRow({ p, onSetActive, onToggleConnect, onSaveKey }: any) {
  const [key, setKey] = useState("");
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    onSaveKey(p.id, key);
    onToggleConnect(p.id, true);
    setEditing(false);
    setKey("");
  };

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#E0E0F0" }}>{p.name}</span>
            {p.active && <Pill color="#FFB800" bg="#FFB80018" border="#FFB80033">active</Pill>}
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.connected ? "#4CAF50" : "#3A3A50", display: "inline-block" }} />
          </div>
          <div style={{ fontSize: 11, color: "#50508A", marginTop: 4 }}>{p.note}</div>
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
            <Btn small primary onClick={handleSave}>Save & test connection</Btn>
            {p.connected && <Btn small onClick={() => { onToggleConnect(p.id, false); setEditing(false); }}>Disconnect</Btn>}
          </div>
        </div>
      )}
    </Card>
  );
}

function ProviderCategory({ title, hint, providers, onSetActive, onToggleConnect, onSaveKey }: any) {
  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>{title}</SectionLabel>
      <div style={{ fontSize: 11, color: "#40406A", marginBottom: 12 }}>{hint}</div>
      {providers.map((p: any) => (
        <ProviderRow key={p.id} p={p} onSetActive={onSetActive} onToggleConnect={onToggleConnect} onSaveKey={onSaveKey} />
      ))}
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

export default function Admin() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/providers")
      .then(r => r.json())
      .then(data => {
        setProviders(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const saveProvider = async (id: string, fields: any) => {
    const res = await fetch("/api/admin/providers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...fields }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProviders(prev => prev.map(p => (p.id === id ? updated : p)));
    }
  };

  const setActive = (id: string) => {
    // Optimistically deactivate all in same category
    const p = providers.find(x => x.id === id);
    if (!p) return;
    setProviders(prev =>
      prev.map(x => (x.category === p.category ? { ...x, active: x.id === id } : x))
    );
    saveProvider(id, { active: true });
  };

  const toggleConnect = (id: string, connected: boolean) => {
    setProviders(prev =>
      prev.map(p => (p.id === id ? { ...p, connected, active: connected ? p.active : false } : p))
    );
    saveProvider(id, { connected, active: false });
  };

  const saveKey = (id: string, apiKey: string) => {
    saveProvider(id, { apiKey, connected: true });
  };

  const togglePublish = (id: string, connected: boolean) => {
    setProviders(prev =>
      prev.map(p => (p.id === id ? { ...p, connected } : p))
    );
    saveProvider(id, { connected });
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 40, color: "#50508A" }}>Loading providers…</div>;
  }

  const scrapers = providers.filter(p => p.category === "scraper");
  const videoGen = providers.filter(p => p.category === "video-gen");
  const narrative = providers.filter(p => p.category === "narrative");
  const publish = providers.filter(p => p.category === "publish");

  return (
    <div>
      <div style={{ fontSize: 11, color: "#40406A", marginBottom: 20 }}>
        Changes are saved to the database automatically. Connect multiple providers per category and switch the active one anytime.
      </div>

      <ProviderCategory
        title="Scraping providers"
        hint="Source of trending video data per platform. Switch providers if one gets rate-limited, raises prices, or drops coverage."
        providers={scrapers}
        onSetActive={setActive}
        onToggleConnect={toggleConnect}
        onSaveKey={saveKey}
      />

      <ProviderCategory
        title="Video generation providers"
        hint="Used if the studio generates supplementary clips, b-roll, or AI avatars rather than filming live."
        providers={videoGen}
        onSetActive={setActive}
        onToggleConnect={toggleConnect}
        onSaveKey={saveKey}
      />

      <ProviderCategory
        title="AI narrative / script providers"
        hint="Builds the cross-video narrative and writes scripts, captions, and hooks."
        providers={narrative}
        onSetActive={setActive}
        onToggleConnect={toggleConnect}
        onSaveKey={saveKey}
      />

      <div>
        <SectionLabel>Direct publishing connections</SectionLabel>
        <div style={{ fontSize: 11, color: "#40406A", marginBottom: 12 }}>
          OAuth credentials so the studio can upload directly to each platform from the Publish step.
        </div>
        {publish.map((p: any) => <PublishRow key={p.id} p={p} onToggle={togglePublish} />)}
      </div>
    </div>
  );
}
