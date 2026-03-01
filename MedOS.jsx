import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts";

// ── ICONS (inline SVG via lucide-react) ──────────────────────────────────────
import {
  FileText, Users, Brain, Zap, BarChart2, ChevronRight,
  Plus, Search, Tag, Bell, AlertTriangle, CheckCircle,
  Heart, Activity, Pill, Calculator, BookOpen, Star,
  Clock, TrendingUp, User, Calendar, ChevronDown, X,
  Stethoscope, FlaskConical, Shield, Layers, Settings,
  ArrowRight, Mic, Save, RefreshCw, ExternalLink
} from "lucide-react";

// ── PALETTE & FONTS ───────────────────────────────────────────────────────────
const G = {
  bg:      "#070B14",
  surface: "#0D1424",
  card:    "#111929",
  border:  "#1E2D45",
  teal:    "#00C8B0",
  tealDim: "#007A6B",
  amber:   "#F0A500",
  rose:    "#FF4D6D",
  sky:     "#38BDF8",
  purple:  "#A78BFA",
  text:    "#E2EAF4",
  muted:   "#5A7194",
  dim:     "#8BA3BE",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Sora:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${G.bg}; color: ${G.text}; font-family: 'Sora', sans-serif; overflow: hidden; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: ${G.surface}; }
  ::-webkit-scrollbar-thumb { background: ${G.border}; border-radius: 2px; }

  .mono { font-family: 'Space Mono', monospace; }

  @keyframes pulse-ring {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0,200,176,0.4); }
    70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(0,200,176,0); }
    100% { transform: scale(0.95); }
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes scanline {
    0% { top: 0%; } 100% { top: 100%; }
  }
  .animate-in { animation: fadeSlideIn 0.35s ease forwards; }

  .nav-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; border-radius: 10px; cursor: pointer;
    border: none; background: transparent; color: ${G.muted};
    font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 500;
    transition: all 0.2s; width: 100%; text-align: left; white-space: nowrap;
  }
  .nav-btn:hover { background: ${G.card}; color: ${G.text}; }
  .nav-btn.active { background: rgba(0,200,176,0.12); color: ${G.teal}; }
  .nav-btn.active svg { color: ${G.teal}; }

  .tag {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 10px; border-radius: 100px; font-size: 11px; font-weight: 600;
    letter-spacing: 0.03em;
  }

  .card {
    background: ${G.card}; border: 1px solid ${G.border};
    border-radius: 14px; padding: 20px;
  }
  .card-hover {
    transition: border-color 0.2s, transform 0.2s;
    cursor: pointer;
  }
  .card-hover:hover { border-color: ${G.teal}; transform: translateY(-1px); }

  .btn-primary {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 18px; border-radius: 8px;
    background: ${G.teal}; color: #000; font-family: 'Sora', sans-serif;
    font-size: 13px; font-weight: 700; border: none; cursor: pointer;
    transition: opacity 0.15s, transform 0.15s;
  }
  .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
  .btn-ghost {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 8px;
    background: transparent; color: ${G.dim}; font-family: 'Sora', sans-serif;
    font-size: 13px; font-weight: 500; border: 1px solid ${G.border}; cursor: pointer;
    transition: all 0.15s;
  }
  .btn-ghost:hover { border-color: ${G.teal}; color: ${G.teal}; }

  .input {
    background: ${G.surface}; border: 1px solid ${G.border}; border-radius: 8px;
    color: ${G.text}; font-family: 'Sora', sans-serif; font-size: 13px;
    padding: 9px 12px; width: 100%; outline: none;
    transition: border-color 0.15s;
  }
  .input:focus { border-color: ${G.teal}; }
  .input::placeholder { color: ${G.muted}; }

  select.input option { background: ${G.card}; }

  .risk-high { background: rgba(255,77,109,0.12); color: ${G.rose}; }
  .risk-med { background: rgba(240,165,0,0.12); color: ${G.amber}; }
  .risk-low { background: rgba(0,200,176,0.12); color: ${G.teal}; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  .flex-col { display: flex; flex-direction: column; }
  .gap-3 { gap: 12px; }
  .gap-2 { gap: 8px; }

  .section-title {
    font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: ${G.muted}; margin-bottom: 12px;
  }

  .scrollable { overflow-y: auto; }
`;

// ── DATA ──────────────────────────────────────────────────────────────────────
const templates = ["URTI", "Hypertension", "Diabetes Type 2", "Antenatal Visit", "Chest Pain", "UTI", "Depression Screening", "Asthma Exacerbation"];

const patients = [
  { id: 1, name: "Amira Hassan", age: 52, dx: "HTN + DM2", follow: "Check HbA1c in 6 weeks", risk: "high", days: 3, vitals: "BP 158/96", avatar: "AH" },
  { id: 2, name: "Khaled Nasser", age: 34, dx: "Asthma", follow: "Review inhaler technique in 2 weeks", risk: "med", days: 11, vitals: "PEFR 72%", avatar: "KN" },
  { id: 3, name: "Fatima Al-Rashid", age: 28, dx: "Antenatal 28wks", follow: "GDM screen + anomaly scan", risk: "low", days: 14, vitals: "BP 110/70", avatar: "FA" },
  { id: 4, name: "Ibrahim Malik", age: 67, dx: "CKD Stage 3 + AF", follow: "Renal panel + CHA₂DS₂-VASc review", risk: "high", days: 5, vitals: "eGFR 42", avatar: "IM" },
  { id: 5, name: "Sara Younis", age: 41, dx: "Hypothyroidism", follow: "TSH recheck in 3 months", risk: "low", days: 22, vitals: "TSH 6.8", avatar: "SY" },
];

const pearls = [
  { id: 1, title: "URTI — Antibiotic Stewardship", body: "Viral URTI: no antibiotics. Consider if >10 days, biphasic illness, or severe symptoms. Use CENTOR score for strep.", tags: ["Respiratory", "Antibiotics"], color: G.sky },
  { id: 2, title: "Metformin & eGFR Cutoffs", body: "Continue if eGFR >45. Use with caution 30–45. Withhold if <30. Review before contrast.", tags: ["DM", "Renal", "Pharmacology"], color: G.purple },
  { id: 3, title: "AF Rate vs Rhythm Control", body: "EAST-AFNET: Early rhythm control reduces CV outcomes. Target HR <110 bpm if rate strategy chosen. Always anticoagulate per CHA₂DS₂-VASc.", tags: ["Cardiology", "AF"], color: G.teal },
  { id: 4, title: "HTN in Pregnancy — Safe Agents", body: "First-line: Labetalol, Nifedipine (LA), Methyldopa. Avoid ACEi/ARBs. Target <140/90.", tags: ["OB", "HTN", "Safety"], color: G.amber },
  { id: 5, title: "CKD Anaemia Workup", body: "Check ferritin >200 + TSAT >20% before ESA. Iron deficiency is commonest correctable cause.", tags: ["Nephrology", "Haematology"], color: G.rose },
];

const weekData = [
  { day: "Mon", patients: 22, revenue: 3400 },
  { day: "Tue", patients: 28, revenue: 4200 },
  { day: "Wed", patients: 19, revenue: 2900 },
  { day: "Thu", patients: 31, revenue: 5100 },
  { day: "Fri", patients: 26, revenue: 4400 },
  { day: "Sat", patients: 14, revenue: 2200 },
];

const dxData = [
  { name: "HTN", value: 28, color: G.rose },
  { name: "DM", value: 21, color: G.amber },
  { name: "URTI", value: 19, color: G.sky },
  { name: "Asthma", value: 12, color: G.purple },
  { name: "Other", value: 20, color: G.muted },
];

// ── COMPONENTS ────────────────────────────────────────────────────────────────

function Stat({ label, value, sub, color }) {
  return (
    <div className="card" style={{ borderColor: `${color}30` }}>
      <div style={{ fontSize: 11, color: G.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color, fontFamily: "'Space Mono', monospace", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: G.dim, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function RiskBadge({ risk }) {
  const map = { high: ["risk-high", "⬆ High Risk"], med: ["risk-med", "⬡ Moderate"], low: ["risk-low", "✓ Stable"] };
  const [cls, label] = map[risk] || map.low;
  return <span className={`tag ${cls}`}>{label}</span>;
}

function Avatar({ initials, color = G.teal }) {
  return (
    <div style={{
      width: 38, height: 38, borderRadius: 10, background: `${color}20`,
      border: `1.5px solid ${color}50`, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, fontWeight: 700, color, flexShrink: 0, fontFamily: "'Space Mono', monospace"
    }}>{initials}</div>
  );
}

// ─────────────────── LAYER 1: Smart Clinical Notebook ────────────────────────
function Layer1() {
  const [template, setTemplate] = useState("URTI");
  const [note, setNote] = useState({ cc: "", hx: "", exam: "", imp: "", plan: "" });
  const [saved, setSaved] = useState(false);

  const doseGuide = {
    URTI: "Paracetamol 1g QDS + Cetirizine 10mg OD if allergic. Saline nasal irrigation.",
    "Hypertension": "Amlodipine 5mg OD (first-line). Add Perindopril 4mg if BP >140/90 at 4 wks.",
    "Diabetes Type 2": "Metformin 500mg BD with meals (titrate to 1g BD over 4 wks). Check eGFR first.",
    "Chest Pain": "Aspirin 300mg stat if ACS suspected. IV access. GTN 400mcg SL. Serial ECGs.",
    "Antenatal Visit": "Folic acid 400mcg OD (5mg if high risk). FeSO4 if Hb <10.5.",
    UTI: "Nitrofurantoin 100mg MR BD × 5 days (avoid if eGFR <30). MSU first.",
    "Depression Screening": "PHQ-9 score. SSRIs if moderate+: Sertraline 50mg OD. Review 2 wks.",
    "Asthma Exacerbation": "Salbutamol 5mg neb. Prednisolone 40mg × 5 days. Check PEFR before/after.",
  };

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="animate-in flex-col gap-3" style={{ height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: G.text }}>Clinical Notebook</div>
          <div style={{ fontSize: 13, color: G.muted, marginTop: 2 }}>Structured templates · Smart dosing</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" style={{ gap: 6 }}><Mic size={14} /> Voice</button>
          <button className="btn-primary" onClick={handleSave}>
            {saved ? <><CheckCircle size={14} /> Saved!</> : <><Save size={14} /> Save Note</>}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16, flex: 1, minHeight: 0 }}>
        {/* Template picker */}
        <div className="card flex-col" style={{ gap: 6, padding: 14, overflowY: "auto" }}>
          <div className="section-title">Templates</div>
          {templates.map(t => (
            <button key={t} onClick={() => setTemplate(t)}
              style={{
                background: template === t ? `${G.teal}15` : "transparent",
                border: `1px solid ${template === t ? G.teal : "transparent"}`,
                borderRadius: 8, padding: "8px 12px", cursor: "pointer",
                color: template === t ? G.teal : G.dim, textAlign: "left",
                fontSize: 13, fontFamily: "'Sora', sans-serif", fontWeight: template === t ? 600 : 400,
                transition: "all 0.15s"
              }}
            >{t}</button>
          ))}
        </div>

        {/* Note area */}
        <div className="flex-col" style={{ gap: 12, display: "flex", flexDirection: "column" }}>
          <div className="card" style={{ background: `${G.teal}08`, borderColor: `${G.teal}30`, padding: "12px 16px" }}>
            <div style={{ fontSize: 11, color: G.teal, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
              ⚡ Auto-Dose Guide — {template}
            </div>
            <div style={{ fontSize: 13, color: G.text, lineHeight: 1.7 }}>{doseGuide[template] || "Select a template to see dosing guidance."}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flex: 1 }}>
            {[
              ["Chief Complaint", "cc", "e.g. Sore throat × 3 days, fever"],
              ["History", "hx", "Duration, severity, associated symptoms..."],
              ["Examination", "exam", "Vitals, systemic findings..."],
              ["Impression / Diagnosis", "imp", "Primary and differential diagnoses..."],
            ].map(([label, key, ph]) => (
              <div key={key} className="flex-col" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: G.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</label>
                <textarea className="input" placeholder={ph}
                  value={note[key]} onChange={e => setNote(n => ({ ...n, [key]: e.target.value }))}
                  style={{ flex: 1, resize: "none", minHeight: 90, lineHeight: 1.6 }} />
              </div>
            ))}
          </div>

          <div className="flex-col" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: G.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Plan & Prescriptions</label>
            <textarea className="input" placeholder="Medications, investigations, referrals, follow-up..."
              value={note.plan} onChange={e => setNote(n => ({ ...n, plan: e.target.value }))}
              style={{ resize: "none", minHeight: 70, lineHeight: 1.6 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────── LAYER 2: Patient Follow-Up Engine ───────────────────────
function Layer2() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");

  const filtered = patients.filter(p => filter === "all" || p.risk === filter);

  return (
    <div className="animate-in" style={{ display: "flex", gap: 16, height: "100%" }}>
      {/* Left: patient list */}
      <div style={{ width: 340, display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: G.text }}>Follow-Up Engine</div>
          <div style={{ fontSize: 13, color: G.muted, marginTop: 2 }}>Smart patient tracking</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "high", "med", "low"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: "5px 12px", borderRadius: 6, border: `1px solid ${filter === f ? G.teal : G.border}`,
                background: filter === f ? `${G.teal}15` : "transparent",
                color: filter === f ? G.teal : G.muted, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "'Sora', sans-serif", textTransform: "capitalize"
              }}
            >{f === "all" ? "All" : f === "high" ? "⬆ High" : f === "med" ? "⬡ Med" : "✓ Stable"}</button>
          ))}
        </div>
        <div className="scrollable flex-col" style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          {filtered.map(p => (
            <div key={p.id} className="card card-hover" onClick={() => setSelected(p)}
              style={{ padding: "14px 16px", borderColor: selected?.id === p.id ? G.teal : G.border }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar initials={p.avatar} color={p.risk === "high" ? G.rose : p.risk === "med" ? G.amber : G.teal} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: G.text }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: G.dim, marginTop: 1 }}>{p.dx} · {p.age}y</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: G.muted, fontFamily: "'Space Mono', monospace" }}>
                    {p.days < 7 ? `${p.days}d` : `${Math.ceil(p.days / 7)}w`}
                  </div>
                  <RiskBadge risk={p.risk} />
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: G.dim, background: G.surface, borderRadius: 6, padding: "6px 10px" }}>
                📋 {p.follow}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: timeline / detail */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        {selected ? (
          <>
            <div className="card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Avatar initials={selected.avatar} color={selected.risk === "high" ? G.rose : selected.risk === "med" ? G.amber : G.teal} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{selected.name}</div>
                <div style={{ fontSize: 13, color: G.dim }}>{selected.dx} · Age {selected.age}</div>
              </div>
              <RiskBadge risk={selected.risk} />
            </div>
            <div className="grid-2">
              <div className="card">
                <div className="section-title">Current Vitals / Labs</div>
                <div style={{ fontSize: 28, fontFamily: "'Space Mono', monospace", fontWeight: 700, color: selected.risk === "high" ? G.rose : G.teal }}>{selected.vitals}</div>
              </div>
              <div className="card">
                <div className="section-title">Next Review</div>
                <div style={{ fontSize: 28, fontFamily: "'Space Mono', monospace", fontWeight: 700, color: G.amber }}>
                  {selected.days < 7 ? `${selected.days}d` : `${Math.ceil(selected.days / 7)}w`}
                </div>
                <div style={{ fontSize: 12, color: G.dim, marginTop: 4 }}>Overdue alert if missed</div>
              </div>
            </div>
            <div className="card" style={{ flex: 1 }}>
              <div className="section-title">Follow-Up Plan</div>
              <div style={{ background: G.surface, borderRadius: 8, padding: 14, fontSize: 14, color: G.text, lineHeight: 1.7 }}>
                {selected.follow}
              </div>
              <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                <button className="btn-primary"><Bell size={14} /> Send Reminder</button>
                <button className="btn-ghost"><Calendar size={14} /> Schedule</button>
                <button className="btn-ghost"><AlertTriangle size={14} /> Flag Urgent</button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, opacity: 0.4 }}>
            <Users size={48} color={G.muted} />
            <div style={{ fontSize: 14, color: G.muted }}>Select a patient to view details</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────── LAYER 3: Knowledge Graph ────────────────────────────────
function Layer3() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newPearl, setNewPearl] = useState({ title: "", body: "", tags: "" });

  const allTags = [...new Set(pearls.flatMap(p => p.tags))];
  const filtered = pearls.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.body.toLowerCase().includes(search.toLowerCase());
    const matchTag = !activeTag || p.tags.includes(activeTag);
    return matchSearch && matchTag;
  });

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Knowledge Graph</div>
          <div style={{ fontSize: 13, color: G.muted, marginTop: 2 }}>Clinical pearls · Guidelines · Linked cases</div>
        </div>
        <button className="btn-primary" onClick={() => setAdding(!adding)}><Plus size={14} /> Add Pearl</button>
      </div>

      {adding && (
        <div className="card" style={{ borderColor: `${G.teal}40` }}>
          <div style={{ fontWeight: 600, marginBottom: 10, color: G.teal }}>New Clinical Pearl</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input className="input" placeholder="Title..." value={newPearl.title} onChange={e => setNewPearl(p => ({ ...p, title: e.target.value }))} />
            <textarea className="input" placeholder="Clinical content..." style={{ resize: "none", minHeight: 80 }} value={newPearl.body} onChange={e => setNewPearl(p => ({ ...p, body: e.target.value }))} />
            <input className="input" placeholder="Tags (comma-separated)..." value={newPearl.tags} onChange={e => setNewPearl(p => ({ ...p, tags: e.target.value }))} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => setAdding(false)}><Save size={14} /> Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Search + tags */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: G.muted }} />
          <input className="input" placeholder="Search pearls..." style={{ paddingLeft: 32 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {allTags.map(t => (
          <button key={t} onClick={() => setActiveTag(activeTag === t ? null : t)}
            style={{
              padding: "5px 12px", borderRadius: 6, border: `1px solid ${activeTag === t ? G.purple : G.border}`,
              background: activeTag === t ? `${G.purple}15` : "transparent",
              color: activeTag === t ? G.purple : G.muted, fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "'Sora', sans-serif"
            }}
          ><Tag size={10} style={{ marginRight: 4 }} />{t}</button>
        ))}
      </div>

      {/* Pearls grid */}
      <div className="scrollable" style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, alignContent: "start" }}>
        {filtered.map(p => (
          <div key={p.id} className="card card-hover" onClick={() => setExpanded(expanded === p.id ? null : p.id)}
            style={{ borderColor: expanded === p.id ? p.color : G.border, borderLeftColor: p.color, borderLeftWidth: 3, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: G.text, flex: 1 }}>{p.title}</div>
              <Star size={14} color={p.color} />
            </div>
            <div style={{
              fontSize: 13, color: G.dim, lineHeight: 1.6, marginTop: 8,
              maxHeight: expanded === p.id ? 200 : 50, overflow: "hidden",
              transition: "max-height 0.3s ease"
            }}>{p.body}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              {p.tags.map(t => (
                <span key={t} className="tag" style={{ background: `${p.color}15`, color: p.color }}>{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────── LAYER 4: Decision Support Tools ─────────────────────────
function Layer4() {
  const [tool, setTool] = useState("curb65");

  // CURB-65
  const [curb, setCurb] = useState({ confusion: false, urea: false, rr: false, bp: false, age: false });
  const curbScore = Object.values(curb).filter(Boolean).length;
  const curbRisk = curbScore <= 1 ? ["Low", G.teal, "Outpatient treatment appropriate"] :
                   curbScore === 2 ? ["Moderate", G.amber, "Consider short admission or close monitoring"] :
                   ["High", G.rose, "Inpatient treatment required — consider ICU"];

  // CHA₂DS₂-VASc
  const [cha, setCha] = useState({ chf: false, htn: false, age75: false, dm: false, stroke: false, vasc: false, age65: false, female: false });
  const chaScore = [cha.chf, cha.htn, cha.age75, cha.age75, cha.dm, cha.stroke, cha.stroke, cha.vasc, cha.age65, cha.female].filter(Boolean).length;
  const chaRisk = chaScore === 0 ? "Low — anticoagulation not required" :
                  chaScore === 1 ? "Moderate — consider anticoagulation" :
                  "High — anticoagulation recommended (DOAC preferred)";

  // Dose calc
  const [weight, setWeight] = useState(70);
  const [drug, setDrug] = useState("amoxicillin");
  const doses = {
    amoxicillin: { unit: 25, per: "mg/kg/day", freq: "÷ TDS", max: "500mg TDS" },
    paracetamol: { unit: 15, per: "mg/kg", freq: "QDS (max 4g/day)", max: "1g QDS" },
    ibuprofen:   { unit: 10, per: "mg/kg", freq: "TDS with food", max: "400mg TDS" },
    gentamicin:  { unit: 5,  per: "mg/kg OD", freq: "OD (monitor levels)", max: "Based on renal function" },
  };
  const d = doses[drug];
  const calcDose = Math.round(weight * d.unit);

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Decision Support Tools</div>
        <div style={{ fontSize: 13, color: G.muted, marginTop: 2 }}>Scores · Drug interactions · Dose calculators</div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {[["curb65", "CURB-65"], ["cha2ds2", "CHA₂DS₂-VASc"], ["dosecalc", "Dose Calc"]].map(([id, label]) => (
          <button key={id} onClick={() => setTool(id)}
            style={{
              padding: "8px 18px", borderRadius: 8,
              border: `1px solid ${tool === id ? G.teal : G.border}`,
              background: tool === id ? `${G.teal}15` : "transparent",
              color: tool === id ? G.teal : G.dim, fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "'Sora', sans-serif", transition: "all 0.15s"
            }}>{label}</button>
        ))}
      </div>

      <div className="scrollable" style={{ flex: 1 }}>
        {tool === "curb65" && (
          <div style={{ display: "flex", gap: 16 }}>
            <div className="card" style={{ flex: 1 }}>
              <div className="section-title">CURB-65 Score — CAP Severity</div>
              {[
                ["confusion", "Confusion (new onset)"],
                ["urea", "Urea > 7 mmol/L"],
                ["rr", "Respiratory Rate ≥ 30/min"],
                ["bp", "BP < 90 systolic or ≤ 60 diastolic"],
                ["age", "Age ≥ 65"],
              ].map(([key, label]) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${G.border}`, cursor: "pointer" }}>
                  <div onClick={() => setCurb(c => ({ ...c, [key]: !c[key] }))}
                    style={{
                      width: 20, height: 20, borderRadius: 5, border: `2px solid ${curb[key] ? G.teal : G.border}`,
                      background: curb[key] ? G.teal : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s", flexShrink: 0, cursor: "pointer"
                    }}>
                    {curb[key] && <CheckCircle size={12} color="#000" />}
                  </div>
                  <span style={{ fontSize: 14, color: G.text }}>{label}</span>
                  <span style={{ marginLeft: "auto", fontFamily: "'Space Mono', monospace", color: G.muted, fontSize: 12 }}>+1</span>
                </label>
              ))}
            </div>
            <div style={{ width: 200, display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="card" style={{ borderColor: `${curbRisk[1]}40`, textAlign: "center", padding: 24 }}>
                <div style={{ fontSize: 11, color: G.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Score</div>
                <div style={{ fontSize: 72, fontWeight: 700, fontFamily: "'Space Mono', monospace", color: curbRisk[1], lineHeight: 1 }}>{curbScore}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: curbRisk[1], marginTop: 8 }}>{curbRisk[0]} Risk</div>
              </div>
              <div className="card" style={{ fontSize: 13, color: G.text, lineHeight: 1.6 }}>{curbRisk[2]}</div>
              <button className="btn-ghost" onClick={() => setCurb({ confusion: false, urea: false, rr: false, bp: false, age: false })}>
                <RefreshCw size={12} /> Reset
              </button>
            </div>
          </div>
        )}

        {tool === "cha2ds2" && (
          <div style={{ display: "flex", gap: 16 }}>
            <div className="card" style={{ flex: 1 }}>
              <div className="section-title">CHA₂DS₂-VASc — AF Stroke Risk</div>
              {[
                ["chf", "C — Congestive Heart Failure", 1],
                ["htn", "H — Hypertension", 1],
                ["age75", "A₂ — Age ≥ 75", 2],
                ["dm", "D — Diabetes Mellitus", 1],
                ["stroke", "S₂ — Stroke / TIA (prior)", 2],
                ["vasc", "V — Vascular Disease (prior MI, PAD)", 1],
                ["age65", "A — Age 65–74", 1],
                ["female", "Sc — Sex category (Female)", 1],
              ].map(([key, label, pts]) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${G.border}`, cursor: "pointer" }}>
                  <div onClick={() => setCha(c => ({ ...c, [key]: !c[key] }))}
                    style={{
                      width: 20, height: 20, borderRadius: 5, border: `2px solid ${cha[key] ? G.purple : G.border}`,
                      background: cha[key] ? G.purple : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s", flexShrink: 0, cursor: "pointer"
                    }}>
                    {cha[key] && <CheckCircle size={12} color="#000" />}
                  </div>
                  <span style={{ fontSize: 13, color: G.text }}>{label}</span>
                  <span style={{ marginLeft: "auto", fontFamily: "'Space Mono', monospace", color: G.purple, fontSize: 12 }}>+{pts}</span>
                </label>
              ))}
            </div>
            <div style={{ width: 200, display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="card" style={{ textAlign: "center", padding: 24, borderColor: `${G.purple}40` }}>
                <div style={{ fontSize: 11, color: G.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Score</div>
                <div style={{ fontSize: 72, fontWeight: 700, fontFamily: "'Space Mono', monospace", color: G.purple, lineHeight: 1 }}>{chaScore}</div>
              </div>
              <div className="card" style={{ fontSize: 13, color: G.text, lineHeight: 1.6 }}>{chaRisk}</div>
              <button className="btn-ghost" onClick={() => setCha({ chf: false, htn: false, age75: false, dm: false, stroke: false, vasc: false, age65: false, female: false })}>
                <RefreshCw size={12} /> Reset
              </button>
            </div>
          </div>
        )}

        {tool === "dosecalc" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="card">
              <div className="section-title">Paediatric Dose Calculator</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: G.muted, display: "block", marginBottom: 6 }}>Drug</label>
                  <select className="input" value={drug} onChange={e => setDrug(e.target.value)}>
                    <option value="amoxicillin">Amoxicillin</option>
                    <option value="paracetamol">Paracetamol</option>
                    <option value="ibuprofen">Ibuprofen</option>
                    <option value="gentamicin">Gentamicin</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: G.muted, display: "block", marginBottom: 6 }}>Weight: {weight} kg</label>
                  <input type="range" min={3} max={100} value={weight} onChange={e => setWeight(Number(e.target.value))}
                    style={{ width: "100%", accentColor: G.teal }} />
                </div>
                <div style={{ background: `${G.teal}10`, border: `1px solid ${G.teal}30`, borderRadius: 10, padding: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: G.teal, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Calculated Dose</div>
                  <div style={{ fontSize: 40, fontWeight: 700, fontFamily: "'Space Mono', monospace", color: G.teal }}>
                    {calcDose}<span style={{ fontSize: 18 }}>mg</span>
                  </div>
                  <div style={{ fontSize: 12, color: G.dim, marginTop: 4 }}>{d.per} · {d.freq}</div>
                  <div style={{ fontSize: 11, color: G.muted, marginTop: 4 }}>Adult max: {d.max}</div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="section-title">Quick Severity Scores</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  ["CURB-65", "CAP severity — mortality risk stratification", G.sky],
                  ["CHA₂DS₂-VASc", "AF stroke risk — anticoagulation decisions", G.purple],
                  ["Wells Score", "DVT / PE probability pre-test", G.amber],
                  ["MEWS", "Early warning — deteriorating inpatient", G.rose],
                  ["PHQ-9", "Depression screening & severity", G.teal],
                  ["AUDIT-C", "Alcohol use disorder screening", G.dim],
                ].map(([name, desc, color]) => (
                  <div key={name} style={{ display: "flex", align: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: G.surface, cursor: "pointer" }}
                    onClick={() => name === "CURB-65" ? setTool("curb65") : name === "CHA₂DS₂-VASc" ? setTool("cha2ds2") : null}>
                    <div style={{ width: 6, borderRadius: 3, background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: G.text }}>{name}</div>
                      <div style={{ fontSize: 11, color: G.muted }}>{desc}</div>
                    </div>
                    <ArrowRight size={14} color={G.muted} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────── LAYER 5: Performance Dashboard ──────────────────────────
function Layer5() {
  return (
    <div className="animate-in scrollable" style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Performance Dashboard</div>
          <div style={{ fontSize: 13, color: G.muted, marginTop: 2 }}>This week · March 2026</div>
        </div>
        <span style={{ padding: "4px 12px", borderRadius: 6, background: `${G.teal}15`, color: G.teal, fontSize: 12, fontWeight: 700 }}>
          ● LIVE
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <Stat label="Patients This Week" value="140" sub="↑ 12% vs last week" color={G.teal} />
        <Stat label="Avg / Day" value="23.3" sub="Peak: Thursday 31" color={G.sky} />
        <Stat label="Revenue (SAR)" value="22.2k" sub="↑ 8.4% vs last week" color={G.amber} />
        <Stat label="Follow-Up Rate" value="87%" sub="Industry avg: 72%" color={G.purple} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 14 }}>
        <div className="card">
          <div className="section-title">Daily Patients & Revenue</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weekData} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={G.teal} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={G.teal} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ambGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={G.amber} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={G.amber} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke={G.muted} tick={{ fontSize: 11, fill: G.muted }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" stroke={G.muted} tick={{ fontSize: 11, fill: G.muted }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke={G.muted} tick={{ fontSize: 11, fill: G.muted }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: G.text }} />
              <Area yAxisId="left" type="monotone" dataKey="patients" stroke={G.teal} fill="url(#tealGrad)" strokeWidth={2} dot={{ r: 3, fill: G.teal }} name="Patients" />
              <Area yAxisId="right" type="monotone" dataKey="revenue" stroke={G.amber} fill="url(#ambGrad)" strokeWidth={2} dot={{ r: 3, fill: G.amber }} name="Revenue (SAR)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="section-title">Diagnosis Breakdown</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={dxData} cx="50%" cy="50%" outerRadius={60} innerRadius={35} dataKey="value" paddingAngle={2}>
                {dxData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
            {dxData.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                <span style={{ color: G.dim, flex: 1 }}>{d.name}</span>
                <span style={{ color: G.text, fontFamily: "'Space Mono', monospace" }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skill tracker */}
      <div className="card">
        <div className="section-title">Skill Progression Tracker</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { skill: "Chronic Disease Mgmt", pct: 84, color: G.teal },
            { skill: "Acute Presentations", pct: 71, color: G.sky },
            { skill: "Procedural Skills", pct: 56, color: G.amber },
            { skill: "Preventive Medicine", pct: 92, color: G.purple },
          ].map(({ skill, pct, color }) => (
            <div key={skill} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: G.dim }}>{skill}</span>
                <span style={{ fontFamily: "'Space Mono', monospace", color }}>{pct}%</span>
              </div>
              <div style={{ height: 6, background: G.surface, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 1s ease" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────── ROOT APP ─────────────────────────────────────────────────
const LAYERS = [
  { id: "notebook",   label: "Clinical Notebook",   icon: FileText,   layer: 1, component: Layer1 },
  { id: "followup",   label: "Follow-Up Engine",     icon: Users,      layer: 2, component: Layer2 },
  { id: "knowledge",  label: "Knowledge Graph",      icon: Brain,      layer: 3, component: Layer3 },
  { id: "decision",   label: "Decision Tools",       icon: Zap,        layer: 4, component: Layer4 },
  { id: "dashboard",  label: "Performance",          icon: BarChart2,  layer: 5, component: Layer5 },
];

export default function MedOS() {
  const [active, setActive] = useState("notebook");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const ActiveComponent = LAYERS.find(l => l.id === active)?.component || Layer1;
  const activeLayer = LAYERS.find(l => l.id === active);

  return (
    <>
      <style>{css}</style>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: G.bg }}>

        {/* ── Sidebar ── */}
        <div style={{
          width: 220, background: G.surface, borderRight: `1px solid ${G.border}`,
          display: "flex", flexDirection: "column", padding: "0 12px", flexShrink: 0,
          position: "relative", overflow: "hidden"
        }}>
          {/* Decorative glow */}
          <div style={{ position: "absolute", top: -60, left: -60, width: 180, height: 180, borderRadius: "50%", background: `${G.teal}06`, pointerEvents: "none" }} />

          {/* Logo */}
          <div style={{ padding: "20px 4px 16px", borderBottom: `1px solid ${G.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, background: G.teal,
                display: "flex", alignItems: "center", justifyContent: "center",
                animation: "pulse-ring 3s infinite"
              }}>
                <Stethoscope size={18} color="#000" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em", color: G.text, fontFamily: "'Space Mono', monospace" }}>MedOS</div>
                <div style={{ fontSize: 9, color: G.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>Clinical OS</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "12px 0", display: "flex", flexDirection: "column", gap: 2 }}>
            <div className="section-title" style={{ padding: "0 10px" }}>Navigation</div>
            {LAYERS.map(l => {
              const Icon = l.icon;
              return (
                <button key={l.id} className={`nav-btn ${active === l.id ? "active" : ""}`} onClick={() => setActive(l.id)}>
                  <Icon size={16} />
                  {l.label}
                  <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "'Space Mono', monospace",
                    color: active === l.id ? G.teal : G.border }}>L{l.layer}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div style={{ borderTop: `1px solid ${G.border}`, padding: "12px 4px" }}>
            <div style={{ fontSize: 10, color: G.muted, fontFamily: "'Space Mono', monospace", marginBottom: 8 }}>
              {time.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar initials="DR" color={G.teal} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Dr. Khalid</div>
                <div style={{ fontSize: 10, color: G.muted }}>General Practice</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main content ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Topbar */}
          <div style={{
            height: 52, borderBottom: `1px solid ${G.border}`, background: G.surface,
            display: "flex", alignItems: "center", padding: "0 24px", gap: 16, flexShrink: 0
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, color: G.muted, fontFamily: "'Space Mono', monospace" }}>LAYER {activeLayer?.layer}</span>
              <ChevronRight size={12} color={G.border} />
              <span style={{ fontSize: 14, fontWeight: 600, color: G.text }}>{activeLayer?.label}</span>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <Bell size={16} color={G.muted} style={{ cursor: "pointer" }} />
                <div style={{ position: "absolute", top: -2, right: -2, width: 6, height: 6, borderRadius: "50%", background: G.rose }} />
              </div>
              <div style={{ width: 1, height: 20, background: G.border }} />
              <span style={{ fontSize: 12, color: G.muted }}>Sunday, 1 March 2026</span>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: 24, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <ActiveComponent key={active} />
          </div>
        </div>
      </div>
    </>
  );
}
