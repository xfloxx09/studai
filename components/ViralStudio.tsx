"use client";
import { useState } from "react";
import Studio from './Studio';
import Admin from './Admin';

export default function ViralStudio() {
    const [view, setView] = useState("studio");

    const navBtn = (id: string, label: string) => (
        <button onClick={() => setView(id)} style={{
            padding: "7px 16px", borderRadius: 7, border: "none", cursor: "pointer",
            background: view === id ? "#15152A" : "transparent",
            color: view === id ? "#E0E0F0" : "#40406A", fontSize: 12, fontWeight: 700,
        }}>{label}</button>
    );

    return (
        <div style={{ minHeight: "100vh", background: "#080810", color: "#E0E0F0", fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13 }}>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}} *{box-sizing:border-box} ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:#1E1E36;border-radius:2px} input,textarea{outline:none}`}</style>

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
                {view === "studio" ? <Studio /> : <Admin />}
            </div>
        </div>
    );
}
