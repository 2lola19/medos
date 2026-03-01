import { useState, useEffect, useRef, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts";
import {
  FileText, Users, Brain, Zap, BarChart2, ChevronRight,
  Plus, Search, Tag, Bell, AlertTriangle, CheckCircle,
  Pill, Calculator, Star, Clock, TrendingUp, Calendar,
  Stethoscope, Shield, ArrowRight, Mic, Save, RefreshCw,
  Lock, Unlock, MicOff, XCircle, Info, Cpu, Radio,
  AlertOctagon, Check, ChevronDown, Layers, Activity,
  Sparkles, BookMarked, TriangleAlert
} from "lucide-react";

// ─── PALETTE ──────────────────────────────────────────────────────────────────
const G = {
  bg:       "#060A12",
  surface:  "#0B1120",
  card:     "#0F1928",
  cardHi:   "#131E32",
  border:   "#1A2B42",
  borderHi: "#243D5E",
  teal:     "#00C8B0",
  tealDim:  "#007A6B",
  amber:    "#F59E0B",
  amberDim: "#92600A",
  rose:     "#F43F5E",
  roseDim:  "#8B1A2E",
  sky:      "#38BDF8",
  purple:   "#A78BFA",
  green:    "#22C55E",
  text:     "#DDE6F0",
  muted:    "#4D6A88",
  dim:      "#7A9BB8",
};

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,600;0,700;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: ${G.bg}; color: ${G.text};
    font-family: 'DM Sans', sans-serif;
    overflow: hidden;
  }

  .mono { font-family: 'JetBrains Mono', monospace; }

  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${G.border}; border-radius: 2px; }

  /* ── Keyframes ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes chipIn {
    from { opacity: 0; transform: scale(0.88) translateY(6px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes pulseDanger {
    0%, 100% { box-shadow: 0 0 0 0 rgba(244,63,94,0.0), inset 0 0 0 1px rgba(244,63,94,0.6); }
    50%       { box-shadow: 0 0 0 6px rgba(244,63,94,0.15), inset 0 0 0 1px rgba(244,63,94,0.9); }
  }
  @keyframes pulseAmber {
    0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.0), inset 0 0 0 1px rgba(245,158,11,0.5); }
    50%       { box-shadow: 0 0 0 6px rgba(245,158,11,0.12), inset 0 0 0 1px rgba(245,158,11,0.9); }
  }
  @keyframes scanBeam {
    from { transform: translateX(-100%); }
    to   { transform: translateX(400%); }
  }
  @keyframes micPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50%       { transform: scale(1.12); opacity: 0.85; }
  }
  @keyframes lockShake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-4px); }
    40%       { transform: translateX(4px); }
    60%       { transform: translateX(-3px); }
    80%       { transform: translateX(3px); }
  }
  @keyframes confirmPop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  @keyframes slideDown {
    from { opacity: 0; max-height: 0; }
    to   { opacity: 1; max-height: 600px; }
  }
  @keyframes unlockGlow {
    0%   { box-shadow: 0 0 0 0 rgba(0,200,176,0); }
    50%  { box-shadow: 0 0 24px 4px rgba(0,200,176,0.35); }
    100% { box-shadow: 0 0 8px 2px rgba(0,200,176,0.15); }
  }
  @keyframes waveBar {
    0%, 100% { height: 4px; }
    50%       { height: 20px; }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  .fade-up  { animation: fadeUp 0.35s ease both; }
  .chip-in  { animation: chipIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both; }

  .chip-danger  { animation: pulseDanger 1.8s ease-in-out infinite; }
  .chip-amber   { animation: pulseAmber  2.2s ease-in-out infinite; }
  .chip-safe    { border: 1px solid ${G.teal} !important; }
  .chip-confirmed { border: 1px solid ${G.green} !important; opacity: 0.75; }

  .btn-primary {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 20px; border-radius: 9px;
    background: ${G.teal}; color: #000;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700;
    border: none; cursor: pointer; transition: all 0.15s; white-space: nowrap;
  }
  .btn-primary:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }

  .btn-ghost {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 16px; border-radius: 9px;
    background: transparent; color: ${G.dim};
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    border: 1px solid ${G.border}; cursor: pointer; transition: all 0.15s;
  }
  .btn-ghost:hover { border-color: ${G.teal}; color: ${G.teal}; }

  .btn-danger {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 16px; border-radius: 9px;
    background: rgba(244,63,94,0.12); color: ${G.rose};
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    border: 1px solid rgba(244,63,94,0.3); cursor: pointer; transition: all 0.15s;
  }
  .btn-danger:hover { background: rgba(244,63,94,0.2); }

  .card {
    background: ${G.card}; border: 1px solid ${G.border};
    border-radius: 13px; padding: 18px;
  }

  .input {
    background: ${G.surface}; border: 1px solid ${G.border}; border-radius: 8px;
    color: ${G.text}; font-family: 'DM Sans', sans-serif; font-size: 13px;
    padding: 9px 12px; width: 100%; outline: none; transition: border-color 0.15s;
  }
  .input:focus { border-color: ${G.teal}; }
  .input::placeholder { color: ${G.muted}; }
  select.input option { background: ${G.card}; }

  .nav-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 9px; cursor: pointer;
    border: none; background: transparent; color: ${G.muted};
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    transition: all 0.18s; width: 100%; text-align: left;
  }
  .nav-btn:hover { background: ${G.cardHi}; color: ${G.text}; }
  .nav-btn.active { background: rgba(0,200,176,0.1); color: ${G.teal}; border: 1px solid rgba(0,200,176,0.18); }

  .section-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
    text-transform: uppercase; color: ${G.muted};
  }

  .tag {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 2px 9px; border-radius: 100px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
  }

  .save-locked {
    background: ${G.surface} !important;
    border: 1px solid ${G.border} !important;
    color: ${G.muted} !important;
    cursor: not-allowed !important;
    animation: lockShake 0.4s ease;
  }
  .save-ready {
    animation: unlockGlow 1.2s ease forwards;
  }

  .voice-bar {
    display: inline-block; width: 3px; border-radius: 2px;
    background: ${G.teal}; transform-origin: bottom;
  }

  .progress-bar-inner {
    height: 100%; border-radius: 3px; transition: width 0.3s ease;
  }

  .scrollable { overflow-y: auto; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  .flex-col { display: flex; flex-direction: column; }
`;

// ─── FORMULARY DATABASE ───────────────────────────────────────────────────────
const FORMULARY = {
  amoxicillin:    { minDose: 250, maxDose: 1000, unit: "mg",  validFreq: ["OD","BD","TDS"],        highRisk: false, note: "Standard URTI/CAP dose 500mg TDS" },
  "co-amoxiclav": { minDose: 375, maxDose: 625,  unit: "mg",  validFreq: ["BD","TDS"],              highRisk: false, note: "Cover anaerobes; monitor LFTs" },
  metformin:      { minDose: 500, maxDose: 1000, unit: "mg",  validFreq: ["OD","BD","TDS"],        highRisk: false, note: "Start low. Check eGFR before prescribing." },
  amlodipine:     { minDose: 5,   maxDose: 10,   unit: "mg",  validFreq: ["OD"],                   highRisk: false, note: "Ankle oedema common. Max 10mg/day." },
  paracetamol:    { minDose: 500, maxDose: 1000, unit: "mg",  validFreq: ["PRN","TDS","QDS"],      highRisk: false, note: "Max 4g/day. Caution in liver disease." },
  ibuprofen:      { minDose: 200, maxDose: 600,  unit: "mg",  validFreq: ["BD","TDS","QDS"],       highRisk: false, note: "Take with food. Avoid if eGFR <30." },
  prednisolone:   { minDose: 5,   maxDose: 60,   unit: "mg",  validFreq: ["OD"],                   highRisk: false, note: "Taper for courses >1 week." },
  warfarin:       { highRisk: true, note: "⚠ HIGH ALERT: INR monitoring mandatory. Interactions: extensive." },
  gentamicin:     { highRisk: true, note: "⚠ HIGH ALERT: Nephrotoxic. Check levels at 18h. OD dosing preferred." },
  insulin:        { highRisk: true, note: "⚠ HIGH ALERT: Verify units carefully. Never abbreviate 'U' — write 'units'." },
  digoxin:        { highRisk: true, note: "⚠ HIGH ALERT: Narrow therapeutic index. Check K⁺ and renal function." },
  lithium:        { highRisk: true, note: "⚠ HIGH ALERT: Narrow therapeutic index. Serum level monitoring required." },
  nitrofurantoin: { minDose: 50,  maxDose: 100,  unit: "mg",  validFreq: ["BD","QDS"],             highRisk: false, note: "Avoid if eGFR <30. 5–7 day course for UTI." },
  salbutamol:     { minDose: 100, maxDose: 400,  unit: "mcg", validFreq: ["PRN","QDS","BD"],       highRisk: false, note: "PRN preferred. If using >3x/wk, review control." },
  lisinopril:     { minDose: 2.5, maxDose: 10,   unit: "mg",  validFreq: ["OD"],                   highRisk: false, note: "Check K⁺ and creatinine 1–2 wks after initiation." },
};

const DOSE_UNIT_MAP = { g: 1000, mg: 1, mcg: 0.001, units: 1, iu: 1 };

// ─── NLP ENTITY EXTRACTION ────────────────────────────────────────────────────
function extractMedications(text) {
  const found = [];
  const seen = new Set();
  // Match: DrugName Dose Unit Frequency  (supports decimals, alternative names)
  const rx = /\b([A-Za-z][\w-]*(?:\s+[A-Za-z][\w-]*)?)\s+(\d+(?:\.\d+)?)\s*(mg|mcg|g|IU|units?)\s+(OD|BD|TDS|QDS|PRN|STAT|nocte|mane|once daily|twice daily|three times daily|four times daily)\b/gi;
  let m;
  while ((m = rx.exec(text)) !== null) {
    const name    = m[1].toLowerCase().trim();
    const dose    = parseFloat(m[2]);
    const unit    = m[3].toLowerCase().replace(/s$/, "");
    const freq    = m[4].toUpperCase();
    const key     = `${name}-${dose}${unit}-${freq}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const profile = FORMULARY[name];
    let status    = "unknown";
    let alertMsg  = "";

    if (!profile) {
      status   = "unknown";
      alertMsg = "Drug not found in local formulary — verify manually.";
    } else if (profile.highRisk) {
      status   = "danger";
      alertMsg = profile.note;
    } else {
      const doseMg = dose * (DOSE_UNIT_MAP[unit] || 1);
      if (doseMg < profile.minDose || doseMg > profile.maxDose) {
        status   = "danger";
        alertMsg = `Outside safe range: ${profile.minDose}–${profile.maxDose}${profile.unit}. ${profile.note}`;
      } else {
        status   = "amber";
        alertMsg = profile.note;
      }
    }

    found.push({ id: key, name: m[1], dose, unit: m[3], freq, status, alertMsg, confirmed: false });
  }
  return found;
}

// ─── VOICE SAMPLE TRANSCRIPTS ─────────────────────────────────────────────────
const VOICE_SAMPLES = [
  `Patient presents with productive cough and fever for 5 days. CURB-65 score 1. Diagnosis: Community-acquired pneumonia. Plan: Amoxicillin 500mg TDS for 7 days. Paracetamol 1000mg QDS PRN. Increase fluid intake. Review in 48 hours if not improving. Follow-up chest X-ray in 6 weeks to confirm resolution.`,
  `62-year-old with poorly controlled type 2 diabetes. HbA1c 9.2%. Initiating Metformin 500mg BD with meals. Titrate to 1000mg BD over 4 weeks if tolerated. Check eGFR and LFTs first. Also adding Amlodipine 5mg OD for blood pressure. Follow-up in 6 weeks with repeat HbA1c and renal panel.`,
  `28-week antenatal visit. BP 148/94 on two readings. No proteinuria. Starting Labetalol 200mg BD. Paracetamol 500mg QDS PRN for headache. Urgent referral to maternal medicine. Patient to return in 48 hours for BP check. Emergency contact numbers provided.`,
  `Post-op day 3. Patient well. Warfarin 5mg OD commenced for AF, target INR 2.0–3.0. Gentamicin 320mg OD — levels at 18 hours. Insulin 10 units Actrapid with meals. Ensure nursing staff aware of high-alert medications. Daily renal function and drug levels.`,
];

// ─── PEARL SUGGESTIONS BY DIAGNOSIS ──────────────────────────────────────────
const PEARL_TRIGGERS = {
  pneumonia: { title: "CAP — CURB-65 Guidance", body: "CURB-65 ≥2: consider admission. Amoxicillin 500mg TDS is first-line outpatient. Add clarithromycin if atypical suspected. Chest X-ray at 6 weeks to exclude malignancy.", tags: ["Respiratory", "Antibiotics"] },
  diabetes:  { title: "T2DM — Metformin Initiation", body: "Start 500mg BD with meals to minimise GI side effects. Titrate q4wks. Check eGFR first — contraindicated if <30. HbA1c target: <48 mmol/mol (6.5%) in newly diagnosed.", tags: ["DM", "Pharmacology"] },
  hypertension: { title: "HTN in Pregnancy — Safe Agents", body: "Safe: Labetalol, Nifedipine LA, Methyldopa. Avoid ACEi/ARBs in all trimesters. Target <140/90. Escalate if BP >160/110 (obstetric emergency).", tags: ["OB", "HTN", "Safety"] },
  af:        { title: "AF — High-Alert Anticoagulation", body: "Warfarin: target INR 2.0–3.0. DOAC preferred in non-valvular AF. CHA₂DS₂-VASc ≥2 in men / ≥3 in women: anticoagulate. Check bleeding risk (HAS-BLED).", tags: ["Cardiology", "AF"] },
};

function detectPearlTrigger(text) {
  const lower = text.toLowerCase();
  if (lower.includes("pneumonia") || lower.includes("cap") || lower.includes("curb"))       return PEARL_TRIGGERS.pneumonia;
  if (lower.includes("diabetes") || lower.includes("metformin") || lower.includes("hba1c")) return PEARL_TRIGGERS.diabetes;
  if (lower.includes("antenatal") || lower.includes("pregnancy") || lower.includes("labetalol")) return PEARL_TRIGGERS.hypertension;
  if (lower.includes("warfarin") || lower.includes(" af ") || lower.includes("atrial"))     return PEARL_TRIGGERS.af;
  return null;
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function Avatar({ initials, color = G.teal, size = 38 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.27),
      background: `${color}18`, border: `1.5px solid ${color}45`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.32, fontWeight: 700, color, flexShrink: 0,
      fontFamily: "'JetBrains Mono', monospace"
    }}>{initials}</div>
  );
}

function RiskBadge({ risk }) {
  const map = {
    high: [G.rose, "⬆ High Risk"],
    med:  [G.amber, "⬡ Moderate"],
    low:  [G.teal, "✓ Stable"],
  };
  const [color, label] = map[risk] || map.low;
  return (
    <span className="tag" style={{ background: `${color}15`, color }}>{label}</span>
  );
}

function Stat({ label, value, sub, color }) {
  return (
    <div className="card" style={{ borderColor: `${color}28` }}>
      <div className="section-label" style={{ marginBottom: 6 }}>{label}</div>
      <div className="mono" style={{ fontSize: 30, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: G.muted, marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

// ─── DOSE CHIP ────────────────────────────────────────────────────────────────
function DoseChip({ med, onConfirm, onOverride, delay = 0 }) {
  const [overrideMode, setOverrideMode] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [localConfirmed, setLocalConfirmed] = useState(false);

  const isConfirmed = med.confirmed || localConfirmed;

  const statusConfig = {
    amber:   { bg: `rgba(245,158,11,0.08)`, borderClass: "chip-amber",  icon: <AlertTriangle size={13} color={G.amber} />, label: "Verify Dose",    labelColor: G.amber,  badgeText: "IN RANGE" },
    danger:  { bg: `rgba(244,63,94,0.09)`,  borderClass: "chip-danger",  icon: <AlertOctagon  size={13} color={G.rose}  />, label: "High Alert",    labelColor: G.rose,   badgeText: "ALERT" },
    unknown: { bg: `rgba(122,155,184,0.07)`, borderClass: "chip-danger",  icon: <Info          size={13} color={G.dim}   />, label: "Not in Formulary", labelColor: G.dim, badgeText: "UNKNOWN" },
  };
  const cfg = isConfirmed
    ? { bg: `rgba(34,197,94,0.06)`, borderClass: "chip-confirmed", icon: <CheckCircle size={13} color={G.green} />, label: "Confirmed", labelColor: G.green, badgeText: "VERIFIED" }
    : (statusConfig[med.status] || statusConfig.unknown);

  const handleConfirm = () => {
    setLocalConfirmed(true);
    onConfirm(med.id);
  };

  return (
    <div className={`chip-in ${cfg.borderClass}`}
      style={{
        borderRadius: 10, padding: "12px 14px",
        background: cfg.bg, animationDelay: `${delay}ms`,
        display: "flex", flexDirection: "column", gap: 8,
        transition: "opacity 0.4s",
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {cfg.icon}
          <span style={{ fontWeight: 700, fontSize: 13, color: G.text, fontFamily: "'JetBrains Mono', monospace" }}>
            {med.name}
          </span>
          <span className="mono" style={{ fontSize: 13, color: G.dim }}>{med.dose}{med.unit}</span>
          <span className="tag" style={{ background: `${cfg.labelColor}15`, color: cfg.labelColor, fontSize: 9 }}>
            {med.freq}
          </span>
        </div>
        <span className="tag mono" style={{ background: `${cfg.labelColor}12`, color: cfg.labelColor, fontSize: 9, letterSpacing: "0.1em" }}>
          {cfg.badgeText}
        </span>
      </div>

      <div style={{ fontSize: 11, color: G.dim, lineHeight: 1.5, paddingLeft: 2 }}>{med.alertMsg}</div>

      {!isConfirmed && (
        overrideMode ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 4, borderTop: `1px solid ${G.border}` }}>
            <input className="input" placeholder="State clinical reason for override..."
              style={{ fontSize: 12, padding: "7px 10px" }}
              value={overrideReason} onChange={e => setOverrideReason(e.target.value)} />
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => setOverrideMode(false)}>Cancel</button>
              <button className="btn-danger" style={{ fontSize: 12, padding: "6px 12px", flex: 1 }}
                onClick={() => { if (overrideReason.trim()) { setLocalConfirmed(true); onOverride(med.id, overrideReason); } }}>
                <Shield size={12} /> Override & Accept
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 7, paddingTop: 4, borderTop: `1px solid ${G.border}` }}>
            {med.status === "danger" || med.status === "unknown" ? (
              <>
                <button className="btn-ghost" style={{ flex: 1, fontSize: 12, padding: "7px 12px", color: G.muted }}
                  onClick={() => setOverrideMode(true)}>
                  <TriangleAlert size={12} /> Override
                </button>
                <button className="btn-ghost" style={{ flex: 1, fontSize: 12, padding: "7px 12px", color: G.rose, borderColor: `rgba(244,63,94,0.3)` }}>
                  <RefreshCw size={12} /> Re-dictate
                </button>
              </>
            ) : (
              <button className="btn-primary" style={{ flex: 1, fontSize: 12, padding: "8px 14px", justifyContent: "center" }}
                onClick={handleConfirm}>
                <Check size={13} /> Tap to Confirm
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
}

// ─── CONFIRMATION LOOP PANEL ──────────────────────────────────────────────────
function ConfirmationPanel({ meds, onConfirm, onOverride, onDismiss }) {
  const confirmed  = meds.filter(m => m.confirmed).length;
  const total      = meds.length;
  const allClear   = confirmed === total;
  const hasHigh    = meds.some(m => (m.status === "danger" || m.status === "unknown") && !m.confirmed);

  return (
    <div className="fade-up" style={{
      border: `1px solid ${hasHigh ? G.rose : allClear ? G.teal : G.amber}`,
      borderRadius: 13, overflow: "hidden",
      boxShadow: `0 0 0 1px ${hasHigh ? G.roseDim : allClear ? G.tealDim : G.amberDim}28`,
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
        background: hasHigh ? `rgba(244,63,94,0.07)` : allClear ? `rgba(0,200,176,0.07)` : `rgba(245,158,11,0.07)`,
        borderBottom: `1px solid ${G.border}`,
      }}>
        <Shield size={15} color={hasHigh ? G.rose : allClear ? G.teal : G.amber} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: G.text }}>
            Confirmation Loop — Medication Safety Gate
          </div>
          <div style={{ fontSize: 11, color: G.muted, marginTop: 1 }}>
            {allClear
              ? "✓ All entities verified. Note may be signed."
              : `${confirmed} of ${total} entities confirmed — note locked until complete`}
          </div>
        </div>
        {/* Progress */}
        <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: allClear ? G.teal : hasHigh ? G.rose : G.amber }}>
          {confirmed}<span style={{ color: G.muted, fontSize: 13 }}>/{total}</span>
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ height: 3, background: G.surface }}>
        <div className="progress-bar-inner" style={{
          width: `${(confirmed / total) * 100}%`,
          background: allClear ? G.teal : hasHigh ? G.rose : G.amber,
        }} />
      </div>
      {/* Chips */}
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, background: G.card }}>
        {meds.map((med, i) => (
          <DoseChip key={med.id} med={med} delay={i * 80} onConfirm={onConfirm} onOverride={onOverride} />
        ))}
      </div>
    </div>
  );
}

// ─── PEARL SUGGESTION BANNER ──────────────────────────────────────────────────
function PearlSuggestion({ pearl, onSave, onDismiss }) {
  return (
    <div className="fade-up" style={{
      border: `1px solid rgba(167,139,250,0.35)`, borderRadius: 11,
      background: `rgba(167,139,250,0.06)`, padding: "12px 16px",
      display: "flex", gap: 12, alignItems: "flex-start",
    }}>
      <Sparkles size={16} color={G.purple} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: G.purple, fontWeight: 700, marginBottom: 3 }}>
          💡 Auto-Pearl Suggestion
        </div>
        <div style={{ fontWeight: 600, fontSize: 13, color: G.text }}>{pearl.title}</div>
        <div style={{ fontSize: 12, color: G.dim, marginTop: 3, lineHeight: 1.5 }}>{pearl.body}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {pearl.tags.map(t => (
            <span key={t} className="tag" style={{ background: `rgba(167,139,250,0.12)`, color: G.purple }}>{t}</span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={onDismiss}>
          <XCircle size={12} /> Skip
        </button>
        <button onClick={onSave} style={{
          padding: "7px 14px", borderRadius: 7, border: `1px solid rgba(167,139,250,0.4)`,
          background: `rgba(167,139,250,0.12)`, color: G.purple, fontSize: 12, fontWeight: 600,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
        }}>
          <BookMarked size={12} /> Save Pearl
        </button>
      </div>
    </div>
  );
}

// ─── VOICE RECORDER ──────────────────────────────────────────────────────────
function VoiceRecorder({ onTranscript }) {
  const [state, setState] = useState("idle"); // idle | recording | processing | done
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  const startRecording = () => {
    setState("recording");
    setProgress(0);
    let t = 0;
    timerRef.current = setInterval(() => {
      t += 100;
      setProgress(Math.min(t / 4000, 0.95));
      if (t >= 4000) {
        clearInterval(timerRef.current);
        setState("processing");
        setTimeout(() => {
          const sample = VOICE_SAMPLES[Math.floor(Math.random() * VOICE_SAMPLES.length)];
          onTranscript(sample);
          setState("done");
          setProgress(1);
          setTimeout(() => setState("idle"), 2000);
        }, 1400);
      }
    }, 100);
  };

  const stop = () => {
    clearInterval(timerRef.current);
    setState("idle");
    setProgress(0);
  };

  const colors = { idle: G.dim, recording: G.rose, processing: G.amber, done: G.teal };
  const labels = { idle: "Dictate", recording: "Recording… tap to stop", processing: "Whisper processing…", done: "✓ Transcribed" };

  return (
    <button onClick={state === "recording" ? stop : state === "idle" ? startRecording : undefined}
      disabled={state === "processing" || state === "done"}
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "9px 16px",
        borderRadius: 9, border: `1px solid ${colors[state]}40`,
        background: `${colors[state]}10`, color: colors[state],
        cursor: state === "processing" ? "wait" : "pointer",
        fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
        transition: "all 0.2s", position: "relative", overflow: "hidden",
      }}>
      {/* scan beam */}
      {state === "processing" && (
        <div style={{
          position: "absolute", top: 0, left: 0, width: "25%", height: "100%",
          background: `linear-gradient(90deg, transparent, ${G.amber}30, transparent)`,
          animation: "scanBeam 1.2s ease-in-out infinite",
        }} />
      )}
      {state === "recording" ? (
        <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 20 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} className="voice-bar" style={{ animationDelay: `${i * 0.12}s`, animation: `waveBar 0.6s ease-in-out ${i * 0.12}s infinite` }} />
          ))}
        </div>
      ) : state === "processing" ? (
        <Cpu size={14} style={{ animation: "spin 1s linear infinite" }} />
      ) : (
        <Mic size={14} style={{ animation: state === "idle" ? "none" : "micPulse 1s ease infinite" }} />
      )}
      {labels[state]}
    </button>
  );
}

// ─── LAYER 1: SMART CLINICAL NOTEBOOK WITH CONFIRMATION LOOP ─────────────────
const TEMPLATES = {
  URTI:          { cc: "Sore throat, cough, fever", hx: "5 days duration, viral prodrome. No dyspnoea.", exam: "Temp 37.8°C. Pharyngeal erythema. No exudate. Clear chest.", imp: "Viral URTI. CENTOR score 1.", plan: "Paracetamol 1000mg QDS PRN. Advise increased fluids, rest. No antibiotics indicated. Return if >10 days or worsening." },
  Hypertension:  { cc: "Hypertension review", hx: "Known HTN. Current: Amlodipine 5mg OD. Compliance good.", exam: "BP 148/92 (right arm, seated). HR 76. No bruits.", imp: "Stage 2 HTN, suboptimal control.", plan: "Uptitrate Amlodipine 5mg OD to 10mg OD. Recheck BP in 4 weeks. Consider ACEi if no response." },
  "Diabetes T2":  { cc: "DM review / HbA1c follow-up", hx: "HbA1c 9.2%. Diet compliance poor. No hypoglycaemia.", exam: "BMI 31. BP 138/88. Feet: no ulcers.", imp: "T2DM, suboptimal control. Obesity.", plan: "Initiate Metformin 500mg BD with meals. Titrate to 1000mg BD over 4 weeks. HbA1c and renal panel in 6 weeks." },
  Antenatal:     { cc: "Routine antenatal — 28 weeks", hx: "GTPAL 1+0+0+1. Uneventful pregnancy. Blood glucose borderline.", exam: "BP 110/70. Fundal height 27cm. FHR 148bpm.", imp: "28-week antenatal visit. At risk GDM.", plan: "GDM screen (75g OGTT). Group B Strep swab at 36 weeks. Continue folic acid 400mcg OD. FeSO4 200mg TDS (Hb 10.8). Review in 4 weeks." },
  "Chest Pain":   { cc: "Acute chest pain — 2 hours", hx: "Central, crushing, radiating to jaw. Diaphoretic. Smoker.", exam: "BP 154/96. HR 92. ECG: ST elevation V1-V4.", imp: "STEMI — activate Cath Lab.", plan: "Aspirin 300mg STAT. GTN 400mcg SL. Morphine 5mg IV titrated. Activate primary PCI pathway." },
};

const TEMPLATE_LIST = Object.keys(TEMPLATES);

function Layer1({ onSaveSuccess }) {
  const [template, setTemplate] = useState("URTI");
  const [note, setNote] = useState({ cc: "", hx: "", exam: "", imp: "", plan: "" });
  const [meds, setMeds] = useState([]); // extracted medications
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAnim, setSavedAnim] = useState(false);
  const [pearlSuggestion, setPearlSuggestion] = useState(null);
  const [lockShakeKey, setLockShakeKey] = useState(0);
  const [signingAnimation, setSigningAnimation] = useState(false);

  const loadTemplate = (t) => {
    setTemplate(t);
    setNote(TEMPLATES[t] || { cc: "", hx: "", exam: "", imp: "", plan: "" });
    setMeds([]);
    setExtracted(false);
    setPearlSuggestion(null);
  };

  const handleExtract = () => {
    const fullText = Object.values(note).join(" ");
    setExtracting(true);
    setTimeout(() => {
      const found = extractMedications(fullText);
      setMeds(found);
      setExtracted(true);
      setExtracting(false);
      const pearl = detectPearlTrigger(fullText);
      if (pearl) setPearlSuggestion(pearl);
    }, 900);
  };

  const handleConfirm = (id) => {
    setMeds(ms => ms.map(m => m.id === id ? { ...m, confirmed: true } : m));
  };

  const handleOverride = (id, reason) => {
    setMeds(ms => ms.map(m => m.id === id ? { ...m, confirmed: true, overrideReason: reason } : m));
  };

  const allConfirmed = meds.length === 0 || meds.every(m => m.confirmed);
  const unconfirmedCount = meds.filter(m => !m.confirmed).length;

  const handleSign = () => {
    if (!allConfirmed && meds.length > 0) {
      setLockShakeKey(k => k + 1);
      return;
    }
    setSigningAnimation(true);
    setTimeout(() => {
      setSavedAnim(true);
      setSigningAnimation(false);
      if (onSaveSuccess) onSaveSuccess();
      setTimeout(() => setSavedAnim(false), 3000);
    }, 700);
  };

  const handleVoiceTranscript = (text) => {
    setNote(n => ({ ...n, plan: text }));
    setExtracted(false);
    setMeds([]);
    setPearlSuggestion(null);
  };

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em" }}>Clinical Notebook</div>
          <div style={{ fontSize: 12, color: G.muted, marginTop: 1 }}>V2SN Engine · Confirmation Loop · Pearl Linker</div>
        </div>
        <VoiceRecorder onTranscript={handleVoiceTranscript} />
        <button className="btn-ghost" onClick={handleExtract} disabled={extracting}
          style={{ borderColor: G.sky, color: G.sky, gap: 7 }}>
          {extracting
            ? <><Cpu size={14} style={{ animation: "spin 1s linear infinite" }} /> Extracting…</>
            : <><Layers size={14} /> Extract & Validate</>}
        </button>
        {/* Dead-Man's Switch Save Button */}
        <button
          key={lockShakeKey}
          onClick={handleSign}
          className={!allConfirmed && meds.length > 0 ? "save-locked" : savedAnim ? "btn-primary save-ready" : "btn-primary"}
          style={{ gap: 7 }}>
          {savedAnim
            ? <><CheckCircle size={14} /> Signed & Saved</>
            : signingAnimation
            ? <><Cpu size={14} style={{ animation: "spin 1s linear infinite" }} /> Signing…</>
            : !allConfirmed && meds.length > 0
            ? <><Lock size={14} /> Locked ({unconfirmedCount} pending)</>
            : <><Unlock size={14} /> Sign Note</>}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 14, flex: 1, minHeight: 0 }}>
        {/* Template sidebar */}
        <div className="card scrollable" style={{ padding: 10, display: "flex", flexDirection: "column", gap: 4 }}>
          <div className="section-label" style={{ padding: "4px 6px", marginBottom: 4 }}>Templates</div>
          {TEMPLATE_LIST.map(t => (
            <button key={t} onClick={() => loadTemplate(t)} style={{
              background: template === t ? `${G.teal}12` : "transparent",
              border: `1px solid ${template === t ? G.teal : "transparent"}`,
              borderRadius: 7, padding: "8px 10px", cursor: "pointer",
              color: template === t ? G.teal : G.dim, textAlign: "left", fontSize: 12,
              fontFamily: "'DM Sans', sans-serif", fontWeight: template === t ? 600 : 400,
              transition: "all 0.15s",
            }}>{t}</button>
          ))}
        </div>

        {/* Main note area */}
        <div className="scrollable" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="grid-2">
            {[["Chief Complaint", "cc"], ["Impression / Dx", "imp"]].map(([label, key]) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label className="section-label">{label}</label>
                <textarea className="input" rows={2} style={{ resize: "none", lineHeight: 1.6 }}
                  placeholder={TEMPLATES[template]?.[key] || ""}
                  value={note[key]} onChange={e => setNote(n => ({ ...n, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div className="grid-2">
            {[["History", "hx"], ["Examination", "exam"]].map(([label, key]) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label className="section-label">{label}</label>
                <textarea className="input" rows={3} style={{ resize: "none", lineHeight: 1.6 }}
                  placeholder={TEMPLATES[template]?.[key] || ""}
                  value={note[key]} onChange={e => setNote(n => ({ ...n, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label className="section-label">Plan / Prescriptions</label>
            <textarea className="input" rows={3} style={{ resize: "none", lineHeight: 1.7 }}
              placeholder="Medications (e.g. Amoxicillin 500mg TDS), investigations, referrals, follow-up…"
              value={note.plan} onChange={e => { setNote(n => ({ ...n, plan: e.target.value })); setExtracted(false); setMeds([]); }} />
          </div>

          {/* Confirmation Loop */}
          {extracted && meds.length > 0 && (
            <ConfirmationPanel meds={meds} onConfirm={handleConfirm} onOverride={handleOverride} onDismiss={() => { setMeds([]); setExtracted(false); }} />
          )}
          {extracted && meds.length === 0 && (
            <div className="fade-up" style={{ padding: "12px 16px", borderRadius: 10, background: `rgba(0,200,176,0.05)`, border: `1px solid ${G.tealDim}`, fontSize: 13, color: G.teal }}>
              ✓ No structured medications detected. Note may be signed freely.
            </div>
          )}

          {/* Pearl suggestion */}
          {pearlSuggestion && (
            <PearlSuggestion pearl={pearlSuggestion} onSave={() => setPearlSuggestion(null)} onDismiss={() => setPearlSuggestion(null)} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LAYER 2: FOLLOW-UP ENGINE ────────────────────────────────────────────────
const PATIENTS = [
  { id: 1, name: "Amira Hassan",    age: 52, dx: "HTN + DM2",      follow: "Check HbA1c + renal panel in 6 weeks",       risk: "high", daysLeft: 3,  vitals: "BP 158/96", avatar: "AH", trend: "↑" },
  { id: 2, name: "Khaled Nasser",   age: 34, dx: "Asthma",          follow: "Review inhaler technique in 2 weeks",          risk: "med",  daysLeft: 11, vitals: "PEFR 72%", avatar: "KN", trend: "→" },
  { id: 3, name: "Fatima Al-Rashid",age: 28, dx: "Antenatal 28wks", follow: "GDM screen + anomaly scan",                   risk: "low",  daysLeft: 14, vitals: "BP 110/70", avatar: "FA", trend: "✓" },
  { id: 4, name: "Ibrahim Malik",   age: 67, dx: "CKD Stage 3 + AF",follow: "Renal panel + CHA₂DS₂-VASc review",          risk: "high", daysLeft: 2,  vitals: "eGFR 42",  avatar: "IM", trend: "↓" },
  { id: 5, name: "Sara Younis",     age: 41, dx: "Hypothyroidism",  follow: "TSH recheck in 3 months",                     risk: "low",  daysLeft: 22, vitals: "TSH 6.8",  avatar: "SY", trend: "→" },
];

function Layer2() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const filtered = PATIENTS.filter(p => filter === "all" || p.risk === filter);

  const riskColor = (r) => r === "high" ? G.rose : r === "med" ? G.amber : G.teal;

  return (
    <div className="fade-up" style={{ display: "flex", gap: 16, height: "100%" }}>
      <div style={{ width: 330, display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em" }}>Follow-Up Engine</div>
          <div style={{ fontSize: 12, color: G.muted, marginTop: 1 }}>Risk-stratified · SMS automation ready</div>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {["all","high","med","low"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", textTransform: "capitalize",
              border: `1px solid ${filter === f ? riskColor(f === "all" ? "low" : f) : G.border}`,
              background: filter === f ? `${riskColor(f === "all" ? "low" : f)}12` : "transparent",
              color: filter === f ? riskColor(f === "all" ? "low" : f) : G.muted,
            }}>{f === "all" ? "All" : f === "high" ? "⬆ High" : f === "med" ? "⬡ Med" : "✓ Stable"}</button>
          ))}
        </div>
        <div className="scrollable" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(p => (
            <div key={p.id} className="card" onClick={() => setSelected(p)}
              style={{
                padding: "13px 15px", cursor: "pointer", transition: "border-color 0.15s, transform 0.15s",
                borderColor: selected?.id === p.id ? riskColor(p.risk) : G.border,
                transform: selected?.id === p.id ? "translateX(2px)" : "none",
              }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Avatar initials={p.avatar} color={riskColor(p.risk)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: G.dim }}>{p.dx} · {p.age}y</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: p.daysLeft <= 3 ? G.rose : p.daysLeft <= 7 ? G.amber : G.dim }}>
                    {p.daysLeft}d
                  </div>
                  <RiskBadge risk={p.risk} />
                </div>
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: G.muted, background: G.surface, borderRadius: 6, padding: "5px 9px" }}>
                📋 {p.follow}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        {selected ? (
          <>
            <div className="card fade-up" style={{ display: "flex", alignItems: "center", gap: 14, borderColor: `${riskColor(selected.risk)}30` }}>
              <Avatar initials={selected.avatar} color={riskColor(selected.risk)} size={48} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{selected.name}</div>
                <div style={{ fontSize: 13, color: G.dim }}>{selected.dx} · Age {selected.age}</div>
              </div>
              <RiskBadge risk={selected.risk} />
            </div>
            <div className="grid-2 fade-up">
              <div className="card" style={{ borderColor: `${riskColor(selected.risk)}28` }}>
                <div className="section-label" style={{ marginBottom: 6 }}>Current Vitals / Labs</div>
                <div className="mono" style={{ fontSize: 26, fontWeight: 700, color: riskColor(selected.risk) }}>{selected.vitals}</div>
                <div style={{ fontSize: 11, color: G.muted, marginTop: 4 }}>Trend: {selected.trend}</div>
              </div>
              <div className="card" style={{ borderColor: `${selected.daysLeft <= 3 ? G.rose : G.amber}28` }}>
                <div className="section-label" style={{ marginBottom: 6 }}>Review Due</div>
                <div className="mono" style={{ fontSize: 26, fontWeight: 700, color: selected.daysLeft <= 3 ? G.rose : G.amber }}>
                  {selected.daysLeft} days
                </div>
                <div style={{ fontSize: 11, color: G.muted, marginTop: 4 }}>Overdue alert if missed</div>
              </div>
            </div>
            <div className="card fade-up" style={{ flex: 1 }}>
              <div className="section-label" style={{ marginBottom: 10 }}>Follow-Up Plan</div>
              <div style={{ background: G.surface, borderRadius: 8, padding: 14, fontSize: 14, color: G.text, lineHeight: 1.7 }}>
                {selected.follow}
              </div>
              <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn-primary" style={{ fontSize: 12, padding: "8px 16px" }}><Bell size={13} /> Send WhatsApp</button>
                <button className="btn-ghost" style={{ fontSize: 12 }}><Calendar size={13} /> Schedule</button>
                <button className="btn-ghost" style={{ fontSize: 12, borderColor: `${G.rose}40`, color: G.rose }}><AlertTriangle size={13} /> Flag Urgent</button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, opacity: 0.35 }}>
            <Users size={44} color={G.muted} />
            <div style={{ fontSize: 13, color: G.muted }}>Select a patient</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LAYER 3: KNOWLEDGE GRAPH ─────────────────────────────────────────────────
const PEARLS_INITIAL = [
  { id: 1, title: "URTI — Antibiotic Stewardship", body: "Viral URTI: no antibiotics. CENTOR score guides strep probability. Use delayed prescription strategy — issue prescription to fill only if no improvement at 72 hours.", tags: ["Respiratory","Antibiotics"], color: G.sky, linked: 3 },
  { id: 2, title: "Metformin & eGFR Cutoffs", body: "Continue if eGFR >45. Caution 30–45 (reduce dose). Withhold if eGFR <30. Always review before IV contrast. Restart 48h post-contrast if renal function stable.", tags: ["DM","Renal","Pharmacology"], color: G.purple, linked: 7 },
  { id: 3, title: "CAP — CURB-65 Stratification", body: "CURB-65 ≥2: consider admission. Amoxicillin 500mg TDS first-line outpatient. Add clarithromycin if atypical suspected. CXR at 6 weeks to exclude malignancy.", tags: ["Respiratory","Antibiotics"], color: G.teal, linked: 5 },
  { id: 4, title: "HTN in Pregnancy — Safe Agents", body: "First-line: Labetalol 200mg BD, Nifedipine LA 30mg OD, or Methyldopa 250mg TDS. Avoid ACEi/ARBs in all trimesters (teratogenic). Target <140/90. Escalate if >160/110.", tags: ["OB","HTN","Safety"], color: G.amber, linked: 4 },
  { id: 5, title: "AF — Rate vs Rhythm Control", body: "EAST-AFNET: early rhythm control reduces CV outcomes. Rate target <110 bpm if rate strategy chosen. Always stratify stroke risk — anticoagulate per CHA₂DS₂-VASc score.", tags: ["Cardiology","AF"], color: G.rose, linked: 9 },
];

function Layer3() {
  const [pearls, setPearls] = useState(PEARLS_INITIAL);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newP, setNewP] = useState({ title: "", body: "", tags: "" });

  const allTags = [...new Set(pearls.flatMap(p => p.tags))];
  const visible = pearls.filter(p => {
    const q = search.toLowerCase();
    return (!q || p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q))
        && (!activeTag || p.tags.includes(activeTag));
  });

  const saveNew = () => {
    if (!newP.title || !newP.body) return;
    setPearls(prev => [...prev, {
      id: Date.now(), title: newP.title, body: newP.body,
      tags: newP.tags.split(",").map(t => t.trim()).filter(Boolean),
      color: [G.sky, G.purple, G.teal, G.amber, G.rose][prev.length % 5], linked: 1,
    }]);
    setNewP({ title: "", body: "", tags: "" });
    setAdding(false);
  };

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em" }}>Knowledge Graph</div>
          <div style={{ fontSize: 12, color: G.muted, marginTop: 1 }}>Clinical pearls · Auto-linked to patient cases</div>
        </div>
        <button className="btn-primary" style={{ fontSize: 12 }} onClick={() => setAdding(a => !a)}><Plus size={14} /> Add Pearl</button>
      </div>

      {adding && (
        <div className="card fade-up" style={{ borderColor: `${G.purple}40` }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: G.purple, marginBottom: 10 }}>New Clinical Pearl</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input className="input" placeholder="Title…" value={newP.title} onChange={e => setNewP(p => ({ ...p, title: e.target.value }))} />
            <textarea className="input" rows={3} placeholder="Clinical content…" style={{ resize: "none" }} value={newP.body} onChange={e => setNewP(p => ({ ...p, body: e.target.value }))} />
            <input className="input" placeholder="Tags (comma-separated)…" value={newP.tags} onChange={e => setNewP(p => ({ ...p, tags: e.target.value }))} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setAdding(false)}>Cancel</button>
              <button className="btn-primary" style={{ fontSize: 12 }} onClick={saveNew}><Save size={12} /> Save</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: 240 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: G.muted }} />
          <input className="input" placeholder="Search pearls…" style={{ paddingLeft: 30 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {allTags.map(t => (
          <button key={t} onClick={() => setActiveTag(activeTag === t ? null : t)}
            style={{
              padding: "4px 11px", borderRadius: 6, fontSize: 11, fontWeight: 700,
              border: `1px solid ${activeTag === t ? G.purple : G.border}`,
              background: activeTag === t ? `${G.purple}14` : "transparent",
              color: activeTag === t ? G.purple : G.muted, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}>{t}</button>
        ))}
      </div>

      <div className="scrollable" style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, alignContent: "start" }}>
        {visible.map((p, i) => (
          <div key={p.id} onClick={() => setExpanded(expanded === p.id ? null : p.id)}
            className="card chip-in"
            style={{
              borderLeftColor: p.color, borderLeftWidth: 3, cursor: "pointer",
              borderColor: expanded === p.id ? p.color : G.border,
              animationDelay: `${i * 50}ms`, transition: "border-color 0.2s",
            }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13, flex: 1, lineHeight: 1.4 }}>{p.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span className="mono" style={{ fontSize: 9, color: G.muted }}>{p.linked} cases</span>
                <Star size={12} color={p.color} />
              </div>
            </div>
            <div style={{
              fontSize: 12, color: G.dim, lineHeight: 1.6, marginTop: 8,
              maxHeight: expanded === p.id ? 200 : 48, overflow: "hidden",
              transition: "max-height 0.35s ease",
            }}>{p.body}</div>
            <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
              {p.tags.map(t => (
                <span key={t} className="tag" style={{ background: `${p.color}12`, color: p.color }}>{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LAYER 4: DECISION TOOLS ──────────────────────────────────────────────────
function Layer4() {
  const [tool, setTool] = useState("curb65");
  const [curb, setCurb] = useState({ confusion: false, urea: false, rr: false, bp: false, age: false });
  const [cha,  setCha]  = useState({ chf: false, htn: false, age75: false, dm: false, stroke: false, vasc: false, age65: false, female: false });
  const [weight, setWeight] = useState(70);
  const [drug,   setDrug]   = useState("amoxicillin");

  const curbScore = Object.values(curb).filter(Boolean).length;
  const curbRisk  = curbScore <= 1 ? [G.teal, "Low", "Outpatient — CURB-65 <2"] :
                    curbScore === 2 ? [G.amber, "Moderate", "Short admission or hospital-at-home"] :
                                     [G.rose,  "High", "Hospital admission — consider HDU if ≥4"];

  const chaScoreRaw = Object.entries({ chf:1,htn:1,age75:2,dm:1,stroke:2,vasc:1,age65:1,female:1 })
    .reduce((s,[k,v]) => s + (cha[k] ? v : 0), 0);
  const chaRisk = chaScoreRaw === 0 ? [G.teal, "Low", "No anticoagulation required"]
                : chaScoreRaw === 1 ? [G.amber, "Moderate", "Consider anticoagulation — discuss with patient"]
                                    : [G.rose,  "High", "Anticoagulate — DOAC preferred over warfarin"];

  const DRUGS = {
    amoxicillin:  { unitDose: 25,   per: "mg/kg/day ÷ TDS", adultMax: "500mg TDS" },
    paracetamol:  { unitDose: 15,   per: "mg/kg QDS",        adultMax: "1g QDS (max 4g/day)" },
    ibuprofen:    { unitDose: 10,   per: "mg/kg TDS",        adultMax: "400mg TDS with food" },
    gentamicin:   { unitDose: 5,    per: "mg/kg OD",         adultMax: "Based on levels — HIGH ALERT" },
    nitrofurantoin:{ unitDose: 3,   per: "mg/kg QDS",        adultMax: "100mg MR BD × 5 days" },
  };
  const dd = DRUGS[drug];
  const calcDose = Math.round(weight * dd.unitDose);
  const isHighAlert = drug === "gentamicin";

  const CheckRow = ({ k, label, pts, state, setter, color }) => (
    <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${G.border}`, cursor: "pointer" }}>
      <div onClick={() => setter(s => ({ ...s, [k]: !s[k] }))} style={{
        width: 20, height: 20, borderRadius: 5, border: `2px solid ${state[k] ? color : G.border}`,
        background: state[k] ? color : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, cursor: "pointer", transition: "all 0.15s",
      }}>
        {state[k] && <Check size={12} color="#000" />}
      </div>
      <span style={{ fontSize: 13, color: G.text, flex: 1 }}>{label}</span>
      <span className="mono" style={{ fontSize: 11, color }}>{pts > 0 ? `+${pts}` : ""}</span>
    </label>
  );

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em" }}>Decision Support</div>
          <div style={{ fontSize: 12, color: G.muted, marginTop: 1 }}>Versioned scoring · Local formulary · Renal adjustment</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["curb65","CURB-65"], ["cha2ds2","CHA₂DS₂"], ["dosecalc","Dose Calc"]].map(([id, label]) => (
            <button key={id} onClick={() => setTool(id)} style={{
              padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: `1px solid ${tool === id ? G.teal : G.border}`,
              background: tool === id ? `${G.teal}12` : "transparent",
              color: tool === id ? G.teal : G.dim, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div className="scrollable" style={{ flex: 1 }}>
        {tool === "curb65" && (
          <div style={{ display: "flex", gap: 14 }}>
            <div className="card" style={{ flex: 1 }}>
              <div className="section-label" style={{ marginBottom: 10 }}>CURB-65 — CAP Severity Score</div>
              {[["confusion","New-onset confusion (AMT ≤8)",1],["urea","Blood urea >7 mmol/L",1],["rr","Respiratory rate ≥30/min",1],["bp","SBP <90 or DBP ≤60 mmHg",1],["age","Age ≥65 years",1]].map(([k,l,p]) => (
                <CheckRow key={k} k={k} label={l} pts={p} state={curb} setter={setCurb} color={G.teal} />
              ))}
              <button className="btn-ghost" style={{ marginTop: 12, fontSize: 12 }} onClick={() => setCurb({ confusion:false,urea:false,rr:false,bp:false,age:false })}><RefreshCw size={12} /> Reset</button>
            </div>
            <div style={{ width: 190, display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="card" style={{ textAlign: "center", padding: "24px 18px", borderColor: `${curbRisk[0]}40` }}>
                <div className="section-label" style={{ marginBottom: 4 }}>Score</div>
                <div className="mono" style={{ fontSize: 70, fontWeight: 700, color: curbRisk[0], lineHeight: 1 }}>{curbScore}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: curbRisk[0], marginTop: 8 }}>{curbRisk[1]}</div>
              </div>
              <div className="card" style={{ fontSize: 12, color: G.text, lineHeight: 1.6 }}>{curbRisk[2]}</div>
            </div>
          </div>
        )}
        {tool === "cha2ds2" && (
          <div style={{ display: "flex", gap: 14 }}>
            <div className="card" style={{ flex: 1 }}>
              <div className="section-label" style={{ marginBottom: 10 }}>CHA₂DS₂-VASc — AF Stroke Risk</div>
              {[["chf","C: Congestive Heart Failure",1],["htn","H: Hypertension",1],["age75","A₂: Age ≥75 years",2],["dm","D: Diabetes Mellitus",1],["stroke","S₂: Stroke / TIA (prior)",2],["vasc","V: Vascular disease (prior MI / PAD)",1],["age65","A: Age 65–74",1],["female","Sc: Female sex",1]].map(([k,l,p]) => (
                <CheckRow key={k} k={k} label={l} pts={p} state={cha} setter={setCha} color={G.purple} />
              ))}
              <button className="btn-ghost" style={{ marginTop: 12, fontSize: 12 }} onClick={() => setCha({chf:false,htn:false,age75:false,dm:false,stroke:false,vasc:false,age65:false,female:false})}><RefreshCw size={12} /> Reset</button>
            </div>
            <div style={{ width: 190, display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="card" style={{ textAlign: "center", padding: "24px 18px", borderColor: `${chaRisk[0]}40` }}>
                <div className="section-label" style={{ marginBottom: 4 }}>Score</div>
                <div className="mono" style={{ fontSize: 70, fontWeight: 700, color: chaRisk[0], lineHeight: 1 }}>{chaScoreRaw}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: chaRisk[0], marginTop: 8 }}>{chaRisk[1]}</div>
              </div>
              <div className="card" style={{ fontSize: 12, color: G.text, lineHeight: 1.6 }}>{chaRisk[2]}</div>
            </div>
          </div>
        )}
        {tool === "dosecalc" && (
          <div className="grid-2">
            <div className="card">
              <div className="section-label" style={{ marginBottom: 12 }}>Weight-Based Dose Calculator</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div className="section-label" style={{ marginBottom: 5 }}>Drug</div>
                  <select className="input" value={drug} onChange={e => setDrug(e.target.value)}>
                    {Object.keys(DRUGS).map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <div className="section-label" style={{ marginBottom: 5 }}>Weight: <span className="mono" style={{ color: G.teal }}>{weight} kg</span></div>
                  <input type="range" min={3} max={120} value={weight} onChange={e => setWeight(+e.target.value)} style={{ width: "100%", accentColor: G.teal }} />
                </div>
                <div style={{
                  background: isHighAlert ? `rgba(244,63,94,0.07)` : `rgba(0,200,176,0.07)`,
                  border: `1px solid ${isHighAlert ? G.rose : G.teal}30`,
                  borderRadius: 10, padding: 16, textAlign: "center",
                }}>
                  {isHighAlert && (
                    <div style={{ fontSize: 10, color: G.rose, fontWeight: 700, textTransform: "uppercase", marginBottom: 6, letterSpacing: "0.08em" }}>
                      ⚠ HIGH-ALERT DRUG
                    </div>
                  )}
                  <div className="section-label" style={{ color: G.muted, marginBottom: 4 }}>Calculated Dose</div>
                  <div className="mono" style={{ fontSize: 38, fontWeight: 700, color: isHighAlert ? G.rose : G.teal }}>
                    {calcDose}<span style={{ fontSize: 18 }}> mg</span>
                  </div>
                  <div style={{ fontSize: 12, color: G.dim, marginTop: 4 }}>{dd.per}</div>
                  <div style={{ fontSize: 11, color: G.muted, marginTop: 3 }}>Adult max: {dd.adultMax}</div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="section-label" style={{ marginBottom: 12 }}>Available Scores</div>
              {[
                ["CURB-65", "CAP severity", G.teal, "curb65"],
                ["CHA₂DS₂-VASc", "AF stroke risk", G.purple, "cha2ds2"],
                ["Wells DVT/PE", "Pre-test probability", G.sky, null],
                ["MEWS", "Deteriorating patient", G.rose, null],
                ["PHQ-9", "Depression severity", G.amber, null],
                ["AUDIT-C", "Alcohol screening", G.dim, null],
              ].map(([name, desc, color, target]) => (
                <div key={name} onClick={() => target && setTool(target)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                  borderRadius: 8, background: G.surface, marginBottom: 6,
                  cursor: target ? "pointer" : "default", transition: "background 0.15s",
                }}>
                  <div style={{ width: 4, height: 28, borderRadius: 2, background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
                    <div style={{ fontSize: 11, color: G.muted }}>{desc}</div>
                  </div>
                  {target && <ArrowRight size={13} color={G.muted} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LAYER 5: DASHBOARD ───────────────────────────────────────────────────────
const WEEK = [
  { day:"Mon", patients:22, revenue:3400 },
  { day:"Tue", patients:28, revenue:4200 },
  { day:"Wed", patients:19, revenue:2900 },
  { day:"Thu", patients:31, revenue:5100 },
  { day:"Fri", patients:26, revenue:4400 },
  { day:"Sat", patients:14, revenue:2200 },
];
const DX_DATA = [
  { name:"HTN", value:28, color:G.rose },
  { name:"DM",  value:21, color:G.amber },
  { name:"URTI",value:19, color:G.sky },
  { name:"Asthma",value:12,color:G.purple },
  { name:"Other",value:20, color:G.muted },
];

function Layer5() {
  return (
    <div className="fade-up scrollable" style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em" }}>Performance Dashboard</div>
          <div style={{ fontSize: 12, color: G.muted, marginTop: 1 }}>Real-time · Aggregated from clinical_notes</div>
        </div>
        <span style={{ padding: "4px 11px", borderRadius: 6, background: `${G.teal}14`, color: G.teal, fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
          ● LIVE
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <Stat label="Patients / Week" value="140" sub="↑ 12% vs last week" color={G.teal} />
        <Stat label="Daily Average"   value="23.3" sub="Peak: Thu 31"  color={G.sky}  />
        <Stat label="Revenue (SAR)"   value="22.2k" sub="↑ 8.4% WoW"  color={G.amber} />
        <Stat label="Follow-Up Rate"  value="87%"  sub="Industry avg: 72%" color={G.purple} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 250px", gap: 14 }}>
        <div className="card">
          <div className="section-label" style={{ marginBottom: 12 }}>Daily Patients & Revenue (Week)</div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={WEEK} margin={{ top:4, right:0, bottom:0, left:-24 }}>
              <defs>
                <linearGradient id="gTeal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={G.teal}  stopOpacity={0.28} />
                  <stop offset="95%" stopColor={G.teal}  stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gAmber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={G.amber} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={G.amber} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke={G.muted} tick={{ fontSize:10, fill:G.muted }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="l" stroke={G.muted} tick={{ fontSize:10, fill:G.muted }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="r" orientation="right" stroke={G.muted} tick={{ fontSize:10, fill:G.muted }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:8, fontSize:12 }} labelStyle={{ color:G.text }} />
              <Area yAxisId="l" type="monotone" dataKey="patients" stroke={G.teal}  fill="url(#gTeal)"  strokeWidth={2} dot={{ r:3, fill:G.teal }}  name="Patients" />
              <Area yAxisId="r" type="monotone" dataKey="revenue"  stroke={G.amber} fill="url(#gAmber)" strokeWidth={2} dot={{ r:3, fill:G.amber }} name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="section-label" style={{ marginBottom: 8 }}>Diagnosis Breakdown</div>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={DX_DATA} cx="50%" cy="50%" outerRadius={58} innerRadius={32} dataKey="value" paddingAngle={2}>
                {DX_DATA.map((d,i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:8, fontSize:12 }} />
            </PieChart>
          </ResponsiveContainer>
          {DX_DATA.map(d => (
            <div key={d.name} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4, fontSize:12 }}>
              <div style={{ width:7, height:7, borderRadius:2, background:d.color }} />
              <span style={{ color:G.dim, flex:1 }}>{d.name}</span>
              <span className="mono" style={{ color:G.text }}>{d.value}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-label" style={{ marginBottom: 12 }}>Skill Progression Tracker</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {[
            ["Chronic Dx Mgmt", 84, G.teal],
            ["Acute Presentations", 71, G.sky],
            ["Procedural Skills", 56, G.amber],
            ["Preventive Care", 92, G.purple],
          ].map(([name, pct, color]) => (
            <div key={name}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:6 }}>
                <span style={{ color:G.dim }}>{name}</span>
                <span className="mono" style={{ color }}>{pct}%</span>
              </div>
              <div style={{ height:5, background:G.surface, borderRadius:3, overflow:"hidden" }}>
                <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:3 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Loop stats */}
      <div className="card" style={{ borderColor: `${G.rose}28` }}>
        <div className="section-label" style={{ marginBottom: 12 }}>Confirmation Loop — Safety Metrics</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            ["Notes Signed", "312", G.teal],
            ["Safety Gates Triggered", "47", G.amber],
            ["Overrides Logged", "8", G.rose],
            ["Auto-Pearls Saved", "23", G.purple],
          ].map(([label, value, color]) => (
            <div key={label} style={{ textAlign:"center", padding:"14px 10px", borderRadius:10, background:G.surface, border:`1px solid ${G.border}` }}>
              <div className="mono" style={{ fontSize:28, fontWeight:700, color }}>{value}</div>
              <div style={{ fontSize:11, color:G.muted, marginTop:4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
const LAYERS = [
  { id:"notebook",  label:"Clinical Notebook",  icon:FileText,  layer:1, Component:Layer1 },
  { id:"followup",  label:"Follow-Up Engine",   icon:Users,     layer:2, Component:Layer2 },
  { id:"knowledge", label:"Knowledge Graph",    icon:Brain,     layer:3, Component:Layer3 },
  { id:"decision",  label:"Decision Tools",     icon:Zap,       layer:4, Component:Layer4 },
  { id:"dashboard", label:"Performance",        icon:BarChart2, layer:5, Component:Layer5 },
];

export default function MedOS() {
  const [active, setActive]     = useState("notebook");
  const [time, setTime]         = useState(new Date());
  const [saveFlash, setSaveFlash] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { Component: ActiveComponent } = LAYERS.find(l => l.id === active);
  const activeLayer = LAYERS.find(l => l.id === active);

  const handleSaveSuccess = () => {
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1800);
  };

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:G.bg }}>

        {/* ── Sidebar ── */}
        <div style={{
          width: 210, background: G.surface,
          borderRight: `1px solid ${G.border}`,
          display:"flex", flexDirection:"column", padding:"0 10px",
          flexShrink: 0, position:"relative", overflow:"hidden",
        }}>
          {/* ambient glow */}
          <div style={{ position:"absolute", top:-80, left:-80, width:200, height:200, borderRadius:"50%", background:`${G.teal}05`, pointerEvents:"none", filter:"blur(30px)" }} />

          {/* Logo */}
          <div style={{ padding:"18px 4px 14px", borderBottom:`1px solid ${G.border}`, display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              width:34, height:34, borderRadius:10, background:G.teal,
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:`0 0 12px ${G.tealDim}`,
            }}>
              <Stethoscope size={18} color="#000" />
            </div>
            <div>
              <div className="mono" style={{ fontWeight:700, fontSize:15, color:G.text, letterSpacing:"-0.02em" }}>MedOS</div>
              <div style={{ fontSize:9, color:G.muted, letterSpacing:"0.1em", textTransform:"uppercase" }}>v2.0 · Clinical OS</div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex:1, padding:"12px 0", display:"flex", flexDirection:"column", gap:2 }}>
            <div className="section-label" style={{ padding:"0 8px", marginBottom:6 }}>Navigation</div>
            {LAYERS.map(l => {
              const Icon = l.icon;
              return (
                <button key={l.id} className={`nav-btn ${active === l.id ? "active" : ""}`} onClick={() => setActive(l.id)}>
                  <Icon size={15} />
                  <span style={{ flex:1 }}>{l.label}</span>
                  <span className="mono" style={{ fontSize:9, color: active === l.id ? G.teal : G.border }}>L{l.layer}</span>
                </button>
              );
            })}
          </nav>

          {/* Safety status indicator */}
          <div style={{ padding:"10px 4px", borderTop:`1px solid ${G.border}` }}>
            <div style={{
              display:"flex", alignItems:"center", gap:7, padding:"8px 10px",
              borderRadius:8, background:`rgba(0,200,176,0.07)`,
              border:`1px solid ${G.tealDim}40`,
            }}>
              <Shield size={13} color={G.teal} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, fontWeight:700, color:G.teal }}>Safety Loop Active</div>
                <div style={{ fontSize:9, color:G.muted }}>Dose validation on</div>
              </div>
              <div style={{ width:6, height:6, borderRadius:"50%", background:G.teal, boxShadow:`0 0 4px ${G.teal}` }} />
            </div>
          </div>

          {/* Doctor card */}
          <div style={{ padding:"10px 4px 16px", display:"flex", alignItems:"center", gap:8 }}>
            <Avatar initials="DR" color={G.teal} />
            <div>
              <div style={{ fontSize:12, fontWeight:600 }}>Dr. Khalid</div>
              <div style={{ fontSize:10, color:G.muted }}>General Practice</div>
            </div>
          </div>
        </div>

        {/* ── Main ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
          {/* Topbar */}
          <div style={{
            height:50, borderBottom:`1px solid ${G.border}`, background:G.surface,
            display:"flex", alignItems:"center", padding:"0 22px", gap:14, flexShrink:0,
            transition:"background 0.3s",
            ...(saveFlash ? { background:`rgba(0,200,176,0.04)`, borderBottomColor:`${G.teal}50` } : {}),
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span className="mono" style={{ fontSize:10, color:G.muted }}>LAYER {activeLayer?.layer}</span>
              <ChevronRight size={11} color={G.border} />
              <span style={{ fontSize:13, fontWeight:600 }}>{activeLayer?.label}</span>
            </div>
            {saveFlash && (
              <div className="fade-up" style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:6, background:`${G.teal}15`, color:G.teal, fontSize:12, fontWeight:600 }}>
                <CheckCircle size={13} /> Note signed to patient timeline
              </div>
            )}
            <div style={{ flex:1 }} />
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <div style={{ position:"relative", cursor:"pointer" }}>
                <Bell size={15} color={G.muted} />
                <div style={{ position:"absolute", top:-1, right:-2, width:6, height:6, borderRadius:"50%", background:G.rose }} />
              </div>
              <div style={{ width:1, height:18, background:G.border }} />
              <span className="mono" style={{ fontSize:11, color:G.muted }}>
                {time.toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit", second:"2-digit" })}
              </span>
              <span style={{ fontSize:11, color:G.muted }}>Sun 1 Mar 2026</span>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex:1, padding:"20px 22px", overflow:"hidden", display:"flex", flexDirection:"column" }}>
            <ActiveComponent key={active} onSaveSuccess={active === "notebook" ? handleSaveSuccess : undefined} />
          </div>
        </div>
      </div>
    </>
  );
}
