"use client";
import { useState, useEffect } from "react";
import Studio from './Studio';
import Admin from './Admin';

/* ───────────────────────── Export/Component Main ───────────────────────── */
export default function ViralStudio() {
    const [view, setView] = useState("studio"); // studio | admin

    // TODO: Move Admin state and handlers here or to a context
    const [scrapers, setScrapers] = useState<any[]>([]);
    const [videoGen, setVideoGen] = useState<any[]>([]);
    const [narrative, setNarrative] = useState<any[]>([]);
    const [publishConnections, setPublishConnections] = useState<any[]>([]);

    const [platforms, setPlatforms] = useState<string[]>(["tiktok", "instagram"]);
    const [freshness, setFreshness] = useState("24h");
    const [scraped, setScraped] = useState<any[]>([]);
    const [scanning, setScanning] = useState(false);
    const [options, setOptions] = useState<any>(null);
    const [generating, setGenerating] = useState(false);
    const [chosen, setChosen] = useState<any>(null);
    const [fields, setFields] = useState<{ title: string; description: string; hashtags: string[]; cta: string }>({ title: "", description: "", hashtags: [], cta: "" });
    const [targets, setTargets] = useState<string[]>([]);
    const [status, setStatus] = useState<any>({});
    const [schedule, setSchedule] = useState("now");

    const activeNarrativeModel = narrative.find(n => n.active)?.name || "none";

    const navBtn = (id: string, label: string) => (
        <button onClick={() => setView(id)} style={{ 
            padding: "7px 16px", borderRadius: 7, border: "none", cursor: "pointer",
            background: view === id ? "#15152A" : "transparent",
            color: view === id ? "#E0E0F0" : "#40406A", fontSize: 12, fontWeight: 700,
        }}>{label}</button>
    );

    // Fetch initial data for Admin section (e.g., provider lists)
    useEffect(() => {
      const fetchData = async () => {
        try {
          // Fetch scraper data
          const scraperRes = await fetch('/api/admin/scrapers');
          const scraperData = await scraperRes.json();
          setScrapers(scraperData);

          // Fetch video gen data
          const videoGenRes = await fetch('/api/admin/video-gen');
          const videoGenData = await videoGenRes.json();
          setVideoGen(videoGenData);

          // Fetch narrative data
          const narrativeRes = await fetch('/api/admin/narrative');
          const narrativeData = await narrativeRes.json();
          setNarrative(narrativeData);

          // Fetch publish connections data
          const publishConnRes = await fetch('/api/admin/publish-connections');
          const publishConnData = await publishConnRes.json();
          setPublishConnections(publishConnData);

        } catch (error) {
          console.error("Failed to fetch admin data:", error);
        }
      };
      fetchData();
    }, []);

    // Function to handle toggling publish connections
    const togglePublish = (id: string, val: boolean) => {
      setPublishConnections(prev => prev.map(p => p.id === id ? { ...p, connected: val } : p));
      // TODO: Add API call to persist this change
    };

    const goToEdit = () => {
      setFields({
        title: chosen.title,
        description: `${chosen.angle} ${chosen.hook}`,
        hashtags: ["viral", "fyp", chosen.format.toLowerCase().replace(/\s+/g, "")],
        cta: "Comment your take below 👇",
      });
      // Proceed to edit step
      // This state transition will likely be managed within Studio.tsx or passed as a prop
    };

    return (
        <div style={{ minHeight: "100vh", background: "#080810", color: "#E0E0F0", fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13 }}>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}} *{box-sizing:border-box} ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:#1E1E36;border-radius:2px} input,textarea{outline:none}`}</style>

            {/* header */} 
            <div style={{ background: "#0B0B18", borderBottom: "1px solid #15152A", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg,#FF3B5C,#7B3FE0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>⚡</div>
                    <div>
                        <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.5px", color: "#F0F0FF" }}>ViralIQ Studio</div>
                        <div style={{ fontSize: 9, color: "#40406A", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>Scrape · Create · Edit · Publish</div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                    {navBtn("studio", "Studio")}
                    {navBtn("admin", "Admin · API management")}
                </div>
            </div>

            <div style={{ maxWidth: 760, margin: "0 auto", padding: 18 }}>
                {view === "studio" ? (
                    <Studio 
                        platforms={platforms}
                        setPlatforms={setPlatforms}
                        freshness={freshness}
                        setFreshness={setFreshness}
                        scraped={scraped}
                        setScraped={setScraped}
                        selected={[]} // This will be managed in Studio.tsx
                        setSelected={() => {}} // Placeholder
                        scanning={scanning}
                        setScanning={setScanning}
                        options={options}
                        setOptions={setOptions}
                        generating={generating}
                        setGenerating={setGenerating}
                        chosen={chosen}
                        setChosen={setChosen}
                        activeNarrativeModel={activeNarrativeModel}
                        fields={fields}
                        setFields={setFields}
                        targets={targets}
                        setTargets={setTargets}
                        schedule={schedule}
                        setSchedule={setSchedule}
                        publishConnections={publishConnections} // Pass down for StepPublish
                        onContinue={goToEdit} // This needs to be handled better for multi-step flow
                    />
                ) : (
                    <Admin 
                        scrapers={scrapers}
                        setScrapers={setScrapers}
                        videoGen={videoGen}
                        setVideoGen={setVideoGen}
                        narrative={narrative}
                        setNarrative={setNarrative}
                        publishConnections={publishConnections}
                        setPublishConnections={setPublishConnections}
                        togglePublish={togglePublish}
                    />
                )}
            </div>
        </div>
    );
}
