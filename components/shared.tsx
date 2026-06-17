"use client";

/* ───────────────────────── shared bits ───────────────────────── */

export const PLATFORMS = [
  { id: "tiktok", label: "TikTok", color: "#FF3B5C" },
  { id: "instagram", label: "Instagram Reels", color: "#E1306C" },
  { id: "facebook", label: "Facebook Reels", color: "#1877F2" },
  { id: "youtube", label: "YouTube Shorts", color: "#FF0000" },
];

export const FRESHNESS = [
  { id: "all", label: "All time" },
  { id: "1h", label: "Last hour" },
  { id: "6h", label: "Last 6h" },
  { id: "24h", label: "Last 24h" },
  { id: "72h", label: "Last 3 days" },
];

export function scoreStyle(score: number) {
  if (score >= 85) return { color: "#FFB800", bg: "rgba(255,184,0,0.12)", border: "rgba(255,184,0,0.3)" };
  if (score >= 70) return { color: "#FF3B5C", bg: "rgba(255,59,92,0.12)", border: "rgba(255,59,92,0.3)" };
  if (score >= 55) return { color: "#A875FF", bg: "rgba(168,117,255,0.12)", border: "rgba(168,117,255,0.3)" };
  return { color: "#6060A0", bg: "rgba(96,96,160,0.12)", border: "rgba(96,96,160,0.3)" };
}

export function Skeleton({ h = 12, w = "100%" }: { h?: number, w?: string }) {
  return <div style={{ height: h, width: w, background: "#1A1A2E", borderRadius: 4, animation: "pulse 1.5s ease-in-out infinite" }} />;
}

export function Card({ children, accent, onClick, selected }: any) {
  return (
    <div onClick={onClick} style={{
      background: selected ? "#12122A" : "#0E0E1C",
      border: `1px solid ${selected ? "#7B3FE066" : (accent || "#15152A")}`,
      borderRadius: 10, padding: 16, marginBottom: 10,
      cursor: onClick ? "pointer" : "default", position: "relative", overflow: "hidden",
    }}>{children}</div>
  );
}

export function SectionLabel({ color = "#A875FF", children }: any) {
  return <div style={{ fontSize: 10, color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>{children}</div>;
}

export function Pill({ children, color = "#40406A", bg = "transparent", border = "#1E1E36" }: any) {
  return <span style={{ padding: "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, color, background: bg, border: `1px solid ${border}` }}>{children}</span>;
}

export function Btn({ children, onClick, primary, disabled, small, style }: any) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small ? "5px 11px" : "9px 18px",
      borderRadius: 7,
      border: primary ? "none" : "1px solid #1E1E36",
      background: disabled ? "#14142299" : primary ? "linear-gradient(135deg,#FF3B5C,#7B3FE0)" : "transparent",
      color: disabled ? "#40406A" : primary ? "#fff" : "#A0A0D0",
      fontSize: small ? 11 : 13, fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      ...style,
    }}>{children}</button>
  );
}

export function TextField({ label, value, onChange, placeholder, type = "text", mono }: any) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <div style={{ fontSize: 11, color: "#50508A", fontWeight: 600, marginBottom: 5 }}>{label}</div>}
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={{
        width: "100%", background: "#06060F", border: "1px solid #1A1A2E", borderRadius: 6,
        padding: "8px 11px", color: "#D0D0F0", fontSize: 12, fontFamily: mono ? "monospace" : "inherit",
      }} />
    </div>
  );
}
