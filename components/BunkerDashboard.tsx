"use client";

import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import dynamic from "next/dynamic";
import SBComparison from "./SBComparison";
import KnowledgeTab from "./KnowledgeTab";

// react-leaflet은 window/document 의존 → SSR 비활성화
const DistanceTab = dynamic(() => import("./DistanceTab"), { ssr: false });
const StraitsTab  = dynamic(() => import("./StraitsTab"),  { ssr: false });

const PRODUCT_COLORS: Record<string, string> = { "IFO 380": "#f97316", "VLSFO": "#38bdf8", "LS MGO": "#a3e635" };
const CRUDE_COLORS:   Record<string, string> = { "WTI": "#facc15", "Brent": "#c084fc", "Dubai": "#fb7185" };
const PRODUCTS = ["IFO 380", "VLSFO", "LS MGO"] as const;
const CRUDES   = ["WTI", "Brent", "Dubai"] as const;
const PORTS    = ["Singapore", "Fujairah", "Rotterdam", "Hong Kong", "LA/Long Beach"] as const;

type Product = typeof PRODUCTS[number];
type Crude   = typeof CRUDES[number];
type Port    = typeof PORTS[number];

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  color: string;
  icon: string;
  summary?: string;
}
interface NewsSource { name: string; color: string; icon: string; }

interface HistoryEntry {
  date: string;
  fullDate: string;
  [key: string]: string | number | null;
}

const generateInitialHistory = (): HistoryEntry[] => {
  const base: Record<string, number> = { "IFO 380": 410, "VLSFO": 530, "LS MGO": 700 };
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    const entry: HistoryEntry = { date: `${d.getMonth() + 1}/${d.getDate()}`, fullDate: d.toISOString().slice(0, 10) };
    PRODUCTS.forEach(p => { base[p] += (Math.random() - 0.48) * 8; entry[p] = Math.round(base[p] * 10) / 10; });
    return entry;
  });
};

type PortPrices = Record<Product, number | null>;

const emptyPortPrices = (): PortPrices => ({ "IFO 380": null, "VLSFO": null, "LS MGO": null });

const initialPortData: Record<Port, PortPrices> = {
  Singapore:       emptyPortPrices(),
  Fujairah:        emptyPortPrices(),
  Rotterdam:       emptyPortPrices(),
  "Hong Kong":     emptyPortPrices(),
  "LA/Long Beach": emptyPortPrices(),
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#e2e8f0" }}>
      <p style={{ marginBottom: 6, color: "#94a3b8", fontFamily: "monospace" }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color, margin: "2px 0" }}>{p.name}: <strong>${p.value}</strong></p>)}
    </div>
  );
};

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 12, padding: "20px", ...style }}>
    {children}
  </div>
);

// 52주 고/저 + 현재 위치 백분위
function compute52w(history: HistoryEntry[], key: Crude): { high: number; low: number; pct: number; current: number } | null {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 365);
  const cutoffISO = cutoff.toISOString().slice(0, 10);
  const vals = history
    .filter(h => h.fullDate >= cutoffISO && h[key] != null)
    .map(h => h[key] as number);
  if (vals.length < 2) return null;
  const high = Math.max(...vals);
  const low  = Math.min(...vals);
  const current = vals[vals.length - 1];
  const pct = high > low ? ((current - low) / (high - low)) * 100 : 50;
  return { high, low, current, pct };
}

// 단순 이동평균 (SMA) — null 값은 건너뜀
function withSMA(history: HistoryEntry[], keys: readonly Crude[], period: number): HistoryEntry[] {
  if (period <= 1) return history;
  return history.map((row, i) => {
    const out: HistoryEntry = { ...row };
    for (const k of keys) {
      const window: number[] = [];
      for (let j = Math.max(0, i - period + 1); j <= i; j++) {
        const v = history[j]?.[k];
        if (typeof v === "number") window.push(v);
      }
      out[`${k}_MA`] = window.length >= Math.min(period, 5) ? +(window.reduce((a, b) => a + b, 0) / window.length).toFixed(2) : null;
    }
    return out;
  });
}

// 스프레드 시계열: Brent-WTI, Brent-Dubai, WTI-Dubai
function buildSpreadData(history: HistoryEntry[]): HistoryEntry[] {
  return history.map(row => {
    const out: HistoryEntry = { date: row.date, fullDate: row.fullDate };
    const w = row.WTI as number | null;
    const b = row.Brent as number | null;
    const d = row.Dubai as number | null;
    out["Brent−WTI"]   = (b != null && w != null) ? +(b - w).toFixed(2) : null;
    out["Brent−Dubai"] = (b != null && d != null) ? +(b - d).toFixed(2) : null;
    out["WTI−Dubai"]   = (w != null && d != null) ? +(w - d).toFixed(2) : null;
    return out;
  });
}

const SPREAD_COLORS: Record<string, string> = {
  "Brent−WTI":   "#a3e635",
  "Brent−Dubai": "#fb7185",
  "WTI−Dubai":   "#facc15",
};

export default function BunkerDashboard() {
  const [mainTab, setMainTab]             = useState("dashboard");
  const [activeBunker, setActiveBunker]   = useState<Product>("VLSFO");
  const [usdkrw, setUsdkrw]               = useState<string | null>(null);
  const [crudePrice, setCrudePrice]       = useState<Record<Crude, number | null>>({ WTI: null, Brent: null, Dubai: null });
  const [crudeHistory, setCrudeHistory]   = useState<HistoryEntry[]>([]);
  const [crudeLoading, setCrudeLoading]   = useState(true);
  const [bunkerHistory, setBunkerHistory] = useState<HistoryEntry[]>(() => generateInitialHistory());
  const [portData, setPortData]           = useState<Record<Port, PortPrices>>(initialPortData);
  const [sbPortLatest, setSbPortLatest]   = useState<Record<string, PortPrices>>({});
  const [showInput, setShowInput]         = useState(false);
  const [activePort, setActivePort]       = useState<Port>("Singapore");
  const [inputTab, setInputTab]           = useState<"today" | "port">("today");
  const [saved, setSaved]                 = useState(false);
  const [activeNewsSource, setActiveNewsSource] = useState<string>("전체");
  const [newsItems, setNewsItems]               = useState<NewsItem[]>([]);
  const [newsSources, setNewsSources]           = useState<NewsSource[]>([]);
  const [newsLoading, setNewsLoading]           = useState(true);
  const [newsUpdatedAt, setNewsUpdatedAt]       = useState<string>("");
  const [crudeRange, setCrudeRange]             = useState(30);
  const [maMode, setMaMode]                     = useState<"off" | "20" | "50">("off");
  const [forwardCurve, setForwardCurve]         = useState<{ curve: Array<{ mLabel: string; shortLabel: string; price: number }>; structure: string | null; m1ToLastSpread: number | null } | null>(null);
  const [showScrollTop, setShowScrollTop]       = useState(false);

  // 스크롤 400px 이상 내려가면 맨 위로 버튼 표시
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // platts-prices.json에서 최신 Platts 가격 자동 로드
  useEffect(() => {
    fetch("/platts-prices.json")
      .then(r => r.json())
      .then((json: { updatedAt: string; latest: Record<string, Record<string, number>>; history: Record<string, Record<string, Record<string, number>>> }) => {
        if (json.latest) {
          const updated = { ...initialPortData };
          for (const [port, fuels] of Object.entries(json.latest)) {
            if (port in updated) {
              updated[port as Port] = {
                "IFO 380": fuels["IFO380"] ?? null,
                "VLSFO":   fuels["VLSFO"]  ?? null,
                "LS MGO":  fuels["LSMGO"]  ?? null,
              };
            }
          }
          setPortData(updated);
        }
        if (json.history) {
          try {
            const stored = JSON.parse(localStorage.getItem("bb_platts_history") ?? "{}");
            for (const [dateISO, ports] of Object.entries(json.history)) {
              stored[dateISO] = stored[dateISO] ?? {};
              for (const [port, fuels] of Object.entries(ports as Record<string, Record<string, number>>)) {
                stored[dateISO][port] = {
                  VLSFO:  (fuels as Record<string, number>)["VLSFO"]  ?? null,
                  IFO380: (fuels as Record<string, number>)["IFO380"] ?? null,
                  LSMGO:  (fuels as Record<string, number>)["LSMGO"]  ?? null,
                };
              }
            }
            localStorage.setItem("bb_platts_history", JSON.stringify(stored));
          } catch { /* ignore */ }
        }
      })
      .catch(() => {});
  }, []);

  const today    = new Date();
  const todayStr = `${today.getMonth() + 1}/${today.getDate()}`;
  const todayISO = today.toISOString().slice(0, 10);

  const [formValues, setFormValues] = useState<Record<Product, string>>({ "IFO 380": "", "VLSFO": "", "LS MGO": "" });
  const [portForm, setPortForm] = useState<Record<Port, Record<Product, string>>>({
    Singapore:       { "IFO 380": "", "VLSFO": "", "LS MGO": "" },
    Fujairah:        { "IFO 380": "", "VLSFO": "", "LS MGO": "" },
    Rotterdam:       { "IFO 380": "", "VLSFO": "", "LS MGO": "" },
    "Hong Kong":     { "IFO 380": "", "VLSFO": "", "LS MGO": "" },
    "LA/Long Beach": { "IFO 380": "", "VLSFO": "", "LS MGO": "" },
  });

  useEffect(() => {
    fetch("https://api.exchangerate-api.com/v4/latest/USD")
      .then(r => r.json()).then((d: { rates?: { KRW?: number } }) => setUsdkrw(d.rates?.KRW?.toLocaleString("ko-KR", { maximumFractionDigits: 0 }) ?? null))
      .catch(() => setUsdkrw("1,370"));
  }, []);

  const [dubaiSource, setDubaiSource] = useState<string>("");

  // Forward curve fetch (Brent M1-M6)
  useEffect(() => {
    fetch("/api/forward-curve")
      .then(r => r.json())
      .then(setForwardCurve)
      .catch(() => {});
  }, []);

  // 뉴스 RSS 자동 수집
  useEffect(() => {
    setNewsLoading(true);
    fetch("/api/news")
      .then(r => r.json())
      .then((json: { items: NewsItem[]; sources: NewsSource[]; updatedAt: string }) => {
        setNewsItems(json.items ?? []);
        setNewsSources(json.sources ?? []);
        setNewsUpdatedAt(json.updatedAt ?? "");
      })
      .catch(() => {})
      .finally(() => setNewsLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/crude-prices?range=1y")
      .then(r => r.json())
      .then((json: { latest: Record<Crude, number | null>; history: HistoryEntry[]; dubaiSource?: string }) => {
        setCrudePrice(json.latest);
        setCrudeHistory(json.history);
        if (json.dubaiSource) setDubaiSource(json.dubaiSource);
      })
      .catch(() => {
        const base: Record<string, number> = { WTI: 78, Brent: 82 };
        setCrudeHistory(Array.from({ length: 30 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (29 - i));
          ["WTI", "Brent"].forEach(c => { base[c] += (Math.random() - 0.5) * 1.5; });
          return { date: `${d.getMonth() + 1}/${d.getDate()}`, fullDate: d.toISOString().slice(0, 10), WTI: +base.WTI.toFixed(2), Brent: +base.Brent.toFixed(2), Dubai: null };
        }));
        setCrudePrice({ WTI: +base.WTI.toFixed(2), Brent: +base.Brent.toFixed(2), Dubai: null });
      })
      .finally(() => setCrudeLoading(false));
  }, []);

  const handleSaveToday = () => {
    const entry: HistoryEntry = { date: todayStr, fullDate: todayISO };
    let has = false;
    PRODUCTS.forEach(p => { const v = parseFloat(formValues[p]); entry[p] = isNaN(v) ? null : v; if (!isNaN(v)) has = true; });
    if (!has) return;
    setBunkerHistory(prev => [...prev.filter(d => d.fullDate !== todayISO), entry].sort((a, b) => a.fullDate > b.fullDate ? 1 : -1));
    setSaved(true); setTimeout(() => { setSaved(false); setShowInput(false); }, 1200);
  };

  const handleSavePort = () => {
    const updated = { ...portData };
    PORTS.forEach(port => PRODUCTS.forEach(p => { const v = parseFloat(portForm[port][p]); if (!isNaN(v)) updated[port] = { ...updated[port], [p]: v }; }));
    setPortData(updated);

    // S&B 비교를 위한 Platts 가격 이력 localStorage 저장 (5개 포트 전부)
    try {
      const stored = JSON.parse(localStorage.getItem("bb_platts_history") ?? "{}") as Record<string, Record<string, Record<string, number | null>>>;
      const todayEntry: Record<string, Record<string, number | null>> = { ...(stored[todayISO] ?? {}) };
      PORTS.forEach(port => {
        todayEntry[port] = {
          VLSFO:  updated[port]["VLSFO"],
          IFO380: updated[port]["IFO 380"],
          LSMGO:  updated[port]["LS MGO"],
        };
      });
      stored[todayISO] = todayEntry;
      // 최근 14일치만 보관
      const keys = Object.keys(stored).sort();
      if (keys.length > 14) keys.slice(0, keys.length - 14).forEach(k => delete stored[k]);
      localStorage.setItem("bb_platts_history", JSON.stringify(stored));
    } catch { /* ignore */ }

    setSaved(true); setTimeout(() => { setSaved(false); setShowInput(false); }, 1200);
  };

  // S&B 최신가 가져오기 (포트별 비교 차트용) — API는 등급별 history array 반환, [0]이 최신
  useEffect(() => {
    type SBEntry = { date: string; dateISO: string; price: number };
    type SBPortGrades = { VLSFO: SBEntry[]; IFO380: SBEntry[]; LSMGO: SBEntry[] };
    fetch("/api/sb-prices")
      .then(r => r.json())
      .then((json: { ports?: Record<string, SBPortGrades> }) => {
        if (!json.ports) return;
        const latest: Record<string, PortPrices> = {};
        for (const [port, grades] of Object.entries(json.ports)) {
          latest[port] = {
            "IFO 380": grades.IFO380?.[0]?.price ?? null,
            "VLSFO":   grades.VLSFO?.[0]?.price  ?? null,
            "LS MGO":  grades.LSMGO?.[0]?.price  ?? null,
          };
        }
        setSbPortLatest(latest);
      })
      .catch(() => {});
  }, []);

  // SBComparison에 넘길 myPrices 매핑 (사용자 Platts 입력값)
  const myPricesForSB = PORTS.reduce((acc, port) => {
    acc[port] = {
      VLSFO:  portData[port]["VLSFO"],
      IFO380: portData[port]["IFO 380"],
      LSMGO:  portData[port]["LS MGO"],
    };
    return acc;
  }, {} as Record<string, { VLSFO: number | null; IFO380: number | null; LSMGO: number | null }>);

  const latest = bunkerHistory.at(-1);
  const prev   = bunkerHistory.at(-2);
  const getDelta = (p: Product) => { if (!latest?.[p] || !prev?.[p]) return { text: "—", up: true }; const d = (latest[p] as number) - (prev[p] as number); return { text: d > 0 ? `▲ ${d.toFixed(1)}` : `▼ ${Math.abs(d).toFixed(1)}`, up: d > 0 }; };
  const getCrudeDelta = (c: Crude) => { if (crudeHistory.length < 2) return { text: "—", up: true }; const l = crudeHistory.at(-1)?.[c]; const pv = crudeHistory.at(-2)?.[c]; if (!l || !pv) return { text: "—", up: true }; const d = (l as number) - (pv as number); return { text: d > 0 ? `▲ ${d.toFixed(2)}` : `▼ ${Math.abs(d).toFixed(2)}`, up: d > 0 }; };

  // ── 입력 패널 ─────────────────────────────────────
  const InputPanel = () => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 20 }}>
      <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 16, padding: 28, width: "100%", maxWidth: 460, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {([["today", "📅 오늘 가격"], ["port", "🌏 포트별"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setInputTab(k)} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: inputTab === k ? "#1e3a5f" : "transparent", color: inputTab === k ? "#f8fafc" : "#475569", fontFamily: "inherit" }}>{l}</button>
          ))}
        </div>
        {inputTab === "today" ? (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc", marginBottom: 4 }}>오늘 벙커유 가격</div>
              <div style={{ fontSize: 11, color: "#475569" }}>Singapore 기준 · USD/MT · {todayStr}</div>
            </div>
            {PRODUCTS.map(p => (
              <div key={p} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: PRODUCT_COLORS[p], display: "block", marginBottom: 6, fontWeight: 600 }}>{p}</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569" }}>$</span>
                  <input type="number" placeholder={`예: ${latest?.[p] ?? "500"}`} value={formValues[p]}
                    onChange={e => setFormValues(prev => ({ ...prev, [p]: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", background: "#060e1a", border: `1px solid ${PRODUCT_COLORS[p]}44`, borderRadius: 8, padding: "10px 12px 10px 28px", color: "#f8fafc", fontSize: 15, fontFamily: "monospace", outline: "none" }} />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc", marginBottom: 4 }}>포트별 가격 업데이트</div>
              <div style={{ fontSize: 11, color: "#475569" }}>USD/MT</div>
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
              {PORTS.map(port => (
                <button key={port} onClick={() => setActivePort(port)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${activePort === port ? "#38bdf8" : "#1e3a5f"}`, background: activePort === port ? "#38bdf822" : "transparent", color: activePort === port ? "#38bdf8" : "#475569", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>{port}</button>
              ))}
            </div>
            {PRODUCTS.map(p => (
              <div key={p} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: PRODUCT_COLORS[p], display: "block", marginBottom: 6, fontWeight: 600 }}>{p}</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569" }}>$</span>
                  <input type="number" placeholder={sbPortLatest[activePort]?.[p] ? `S&B: $${sbPortLatest[activePort]?.[p]}` : (portData[activePort]?.[p] ? `이전: $${portData[activePort]?.[p]}` : "Platts 가격 입력")} value={portForm[activePort][p]}
                    onChange={e => setPortForm(prev => ({ ...prev, [activePort]: { ...prev[activePort], [p]: e.target.value } }))}
                    style={{ width: "100%", boxSizing: "border-box", background: "#060e1a", border: `1px solid ${PRODUCT_COLORS[p]}44`, borderRadius: 8, padding: "10px 12px 10px 28px", color: "#f8fafc", fontSize: 15, fontFamily: "monospace", outline: "none" }} />
                </div>
              </div>
            ))}
          </>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={() => setShowInput(false)} style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #1e3a5f", background: "transparent", color: "#475569", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>취소</button>
          <button onClick={inputTab === "today" ? handleSaveToday : handleSavePort} style={{ flex: 2, padding: 12, borderRadius: 8, border: "none", background: saved ? "#a3e635" : "linear-gradient(135deg,#f97316,#38bdf8)", color: saved ? "#060e1a" : "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", transition: "all 0.3s" }}>{saved ? "✓ 저장됨!" : "저장하기"}</button>
        </div>
      </div>
    </div>
  );

  // ── 뉴스 탭 ───────────────────────────────────────
  const NewsTab = () => {
    const filtered = activeNewsSource === "전체"
      ? newsItems
      : newsItems.filter(n => n.source === activeNewsSource);

    const formatRelative = (iso: string): string => {
      const d = new Date(iso); if (isNaN(d.getTime())) return "";
      const diffMs = Date.now() - d.getTime();
      const m = Math.floor(diffMs / 60000);
      if (m < 1) return "방금 전";
      if (m < 60) return `${m}분 전`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}시간 전`;
      const days = Math.floor(h / 24);
      if (days < 7) return `${days}일 전`;
      return d.toISOString().slice(0, 10);
    };

    return (
      <div style={{ padding: "24px 20px 0" }}>
        {/* 소스 필터 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {[{ name: "전체", color: "#94a3b8", icon: "📰" }, ...newsSources].map(s => (
            <button key={s.name} onClick={() => setActiveNewsSource(s.name)} style={{
              padding: "7px 13px", borderRadius: 8,
              border: `1px solid ${activeNewsSource === s.name ? s.color : "#1e3a5f"}`,
              background: activeNewsSource === s.name ? s.color + "18" : "transparent",
              color: activeNewsSource === s.name ? s.color : "#475569",
              cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
            }}>{s.icon} {s.name}</button>
          ))}
        </div>

        {/* 업데이트 시각 */}
        <div style={{ fontSize: 10, color: "#475569", marginBottom: 12, textAlign: "right" }}>
          {newsUpdatedAt && `업데이트: ${new Date(newsUpdatedAt).toLocaleString("ko-KR", { hour: "2-digit", minute: "2-digit", month: "2-digit", day: "2-digit" })} · ${filtered.length}건`}
        </div>

        {newsLoading ? (
          <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}>
            뉴스 불러오는 중...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#475569", fontSize: 12, background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 10 }}>
            뉴스가 없습니다.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {filtered.map((n, i) => (
              <a key={i} href={n.link} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 10, padding: "14px 16px", transition: "all 0.15s", cursor: "pointer" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = n.color; (e.currentTarget as HTMLDivElement).style.background = "#0f1f38"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#1e3a5f"; (e.currentTarget as HTMLDivElement).style.background = "#0a1628"; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: n.color, padding: "2px 8px", borderRadius: 4, background: n.color + "18" }}>{n.icon} {n.source}</span>
                    <span style={{ fontSize: 10, color: "#475569" }}>{formatRelative(n.pubDate)}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", lineHeight: 1.4, marginBottom: n.summary ? 6 : 0 }}>{n.title}</div>
                  {n.summary && (
                    <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{n.summary}{n.summary.length >= 180 ? "…" : ""}</div>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}

        <div style={{ marginTop: 20, padding: "10px 14px", fontSize: 10, color: "#334155", textAlign: "center" }}>
          RSS 피드 · 30분 캐시 · 헤드라인 클릭 시 원문으로 이동
        </div>
      </div>
    );
  };

  // ── 대시보드 탭 ───────────────────────────────────
  const CrudeCard = ({ c }: { c: Crude }) => {
    const delta = getCrudeDelta(c);
    const r52 = compute52w(crudeHistory, c);
    return (
      <Card style={{ border: `1px solid ${CRUDE_COLORS[c]}44`, overflow: "hidden", minWidth: 0 }}>
        <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c}</div>
        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color: CRUDE_COLORS[c], lineHeight: 1.1, whiteSpace: "nowrap" }}>
          {crudeLoading ? "..." : crudePrice[c] ? `$${crudePrice[c]}` : "—"}
        </div>
        <div style={{ fontSize: 11, color: delta.up ? "#f97316" : "#38bdf8", marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {delta.text} <span style={{ color: "#475569" }}>vs 전일</span>
        </div>
        {/* 52주 고/저 위치 바 */}
        {r52 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ position: "relative", height: 4, background: "#0f2744", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ position: "absolute", left: `${Math.max(0, Math.min(100, r52.pct))}%`, top: -2, transform: "translateX(-50%)", width: 8, height: 8, borderRadius: 4, background: CRUDE_COLORS[c] }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 9, color: "#475569", fontFamily: "monospace" }}>
              <span>${r52.low.toFixed(0)}</span>
              <span style={{ color: "#94a3b8" }}>{r52.pct.toFixed(0)}%ile · 52w</span>
              <span>${r52.high.toFixed(0)}</span>
            </div>
          </div>
        )}
        {c === "Dubai" && <div style={{ fontSize: 10, color: "#334155", marginTop: 6 }}>
          {crudePrice[c] ? `※ ${dubaiSource || "Murban proxy"}` : "※ 로딩 실패"}
        </div>}
      </Card>
    );
  };

  const BunkerCard = ({ p }: { p: Product }) => {
    const delta = getDelta(p);
    const isActive = activeBunker === p;
    return (
      <div onClick={() => setActiveBunker(p)} style={{
        background: isActive ? "linear-gradient(135deg,#0f2744,#0f172a)" : "#0a1628",
        border: `1px solid ${isActive ? PRODUCT_COLORS[p] : "#1e3a5f"}`,
        borderRadius: 12, padding: "16px 18px", cursor: "pointer", transition: "all 0.2s",
        boxShadow: isActive ? `0 0 20px ${PRODUCT_COLORS[p]}22` : "none", overflow: "hidden", minWidth: 0,
      }}>
        <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p}</div>
        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color: PRODUCT_COLORS[p], lineHeight: 1.1, whiteSpace: "nowrap" }}>{latest?.[p] ? `$${latest[p]}` : "—"}</div>
        <div style={{ fontSize: 11, color: delta.up ? "#f97316" : "#38bdf8", marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {delta.text} <span style={{ color: "#475569" }}>vs 전일</span>
        </div>
      </div>
    );
  };

  const DashboardTab = () => (
    <div style={{ padding: "24px 20px 0" }}>
      <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 10 }}>원유 벤치마크 (실시간 · USD/bbl)</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
        {CRUDES.map(c => <CrudeCard key={c} c={c} />)}
      </div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>원유 가격 추이</div>
            <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>USD/bbl · Stooq + OilPrice</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {([["30일", 30], ["1년", 365]] as const).map(([label, val]) => (
              <button key={val} onClick={() => setCrudeRange(val)} style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${crudeRange === val ? "#38bdf8" : "#1e3a5f"}`, background: crudeRange === val ? "#38bdf822" : "transparent", color: crudeRange === val ? "#38bdf8" : "#475569", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>{label}</button>
            ))}
          </div>
        </div>
        {/* MA 토글 */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#475569" }}>MA:</span>
          {([["off", "끄기"], ["20", "20일"], ["50", "50일"]] as const).map(([val, label]) => (
            <button key={val} onClick={() => setMaMode(val)} style={{ padding: "3px 10px", borderRadius: 5, fontSize: 10, border: `1px solid ${maMode === val ? "#a3e635" : "#1e3a5f"}`, background: maMode === val ? "#a3e63522" : "transparent", color: maMode === val ? "#a3e635" : "#475569", cursor: "pointer", fontFamily: "inherit" }}>{label}</button>
          ))}
        </div>
        {crudeLoading
          ? <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}>로딩 중...</div>
          : <ResponsiveContainer width="100%" height={200}>
              <LineChart data={(maMode === "off" ? crudeHistory : withSMA(crudeHistory, CRUDES, parseInt(maMode))).slice(-crudeRange)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: "#475569" }}
                  tickLine={false}
                  axisLine={false}
                  interval={crudeRange === 30 ? 2 : 20}
                  tickFormatter={(value: string) => {
                    if (crudeRange === 365) {
                      const [m, d] = value.split("/").map(Number);
                      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                      return d <= 7 ? (months[m - 1] ?? value) : "";
                    }
                    return value;
                  }}
                />
                <YAxis tick={{ fontSize: 9, fill: "#475569" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8", paddingTop: 8 }} />
                {CRUDES.map(c => <Line key={c} type="monotone" dataKey={c} stroke={CRUDE_COLORS[c]} strokeWidth={2} dot={false} connectNulls />)}
                {maMode !== "off" && CRUDES.map(c => (
                  <Line key={`${c}_MA`} type="monotone" dataKey={`${c}_MA`} name={`${c} MA${maMode}`} stroke={CRUDE_COLORS[c]} strokeWidth={1} strokeDasharray="4 3" dot={false} connectNulls opacity={0.55} />
                ))}
              </LineChart>
            </ResponsiveContainer>
        }
      </Card>

      {/* Brent 선물 forward curve (M1-M6) */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>Brent 선물 곡선 (M1–M6)</div>
            <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>ICE Brent 월별 선물 · USD/bbl</div>
          </div>
          {forwardCurve?.structure && (
            <div style={{ fontSize: 11, fontWeight: 600, color: forwardCurve.structure === "backwardation" ? "#f97316" : forwardCurve.structure === "contango" ? "#38bdf8" : "#94a3b8", padding: "4px 10px", borderRadius: 6, background: forwardCurve.structure === "backwardation" ? "#f9731622" : forwardCurve.structure === "contango" ? "#38bdf822" : "#1e3a5f44" }}>
              {forwardCurve.structure === "backwardation" ? "백워데이션" : forwardCurve.structure === "contango" ? "콘탱고" : "Flat"}
              {forwardCurve.m1ToLastSpread != null && ` · M1→M${forwardCurve.curve.length} ${forwardCurve.m1ToLastSpread > 0 ? "+" : ""}${forwardCurve.m1ToLastSpread}`}
            </div>
          )}
        </div>
        {!forwardCurve || forwardCurve.curve.length === 0 ? (
          <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: 12 }}>
            로딩 중...
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={forwardCurve.curve} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="mLabel" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#475569" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} width={44} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  content={(({ active, payload, label }: any) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0]?.payload as { shortLabel?: string; price?: number } | undefined;
                    if (!p) return null;
                    return (
                      <div style={{ background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#e2e8f0" }}>
                        <div style={{ color: "#94a3b8", fontSize: 10 }}>{label} · {p.shortLabel}</div>
                        <div style={{ color: "#c084fc", fontFamily: "monospace" }}>${p.price}</div>
                      </div>
                    );
                  })}
                />
                <Line type="monotone" dataKey="price" stroke="#c084fc" strokeWidth={2} dot={{ r: 4, fill: "#c084fc" }} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 8, fontSize: 9, color: "#334155" }}>
              {forwardCurve.curve.map(p => `${p.mLabel} ${p.shortLabel}: $${p.price}`).join("  ·  ")}
            </div>
          </>
        )}
      </Card>

      {/* 원유 스프레드 (Brent-WTI / Brent-Dubai / WTI-Dubai) */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>원유 스프레드</div>
          <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>벤치마크 간 가격차 · USD/bbl</div>
        </div>
        {crudeLoading || crudeHistory.length === 0 ? (
          <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: 12 }}>로딩 중...</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={buildSpreadData(crudeHistory).slice(-crudeRange)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#475569" }} tickLine={false} axisLine={false} interval={crudeRange === 30 ? 2 : 20} />
              <YAxis tick={{ fontSize: 9, fill: "#475569" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8", paddingTop: 8 }} />
              {(["Brent−WTI", "Brent−Dubai", "WTI−Dubai"] as const).map(s => (
                <Line key={s} type="monotone" dataKey={s} stroke={SPREAD_COLORS[s]} strokeWidth={2} dot={false} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: "#1e3a5f" }} />
        <div style={{ fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: "2px" }}>Bunker Fuel</div>
        <div style={{ flex: 1, height: 1, background: "#1e3a5f" }} />
      </div>
      <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 10 }}>벙커유 가격 (Singapore 기준 · USD/MT)</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
        {PRODUCTS.map(p => <BunkerCard key={p} p={p} />)}
      </div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 8, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>벙커유 가격 추이</div>
            <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>USD/MT · 직접 입력</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {PRODUCTS.map(p => (
              <button key={p} onClick={() => setActiveBunker(p)} style={{ background: activeBunker === p ? PRODUCT_COLORS[p] + "22" : "transparent", border: `1px solid ${activeBunker === p ? PRODUCT_COLORS[p] : "#1e3a5f"}`, color: activeBunker === p ? PRODUCT_COLORS[p] : "#475569", borderRadius: 6, padding: "3px 10px", fontSize: 10, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>{p}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={bunkerHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#475569" }} tickLine={false} axisLine={false} interval={2} />
            <YAxis tick={{ fontSize: 9, fill: "#475569" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} width={40} />
            <Tooltip content={<CustomTooltip />} />
            {PRODUCTS.map(p => (
              <Line key={p} type="monotone" dataKey={p} stroke={PRODUCT_COLORS[p]}
                strokeWidth={activeBunker === p ? 2.5 : 1} dot={false} opacity={activeBunker === p ? 1 : 0.3} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Platts vs S&B 비교 (5개 포트 × 3유종 데이터 모두 포함) */}
      <SBComparison myPrices={myPricesForSB} />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#060e1a", color: "#e2e8f0", fontFamily: "'DM Sans','Noto Sans KR',sans-serif", paddingBottom: 48 }}>
      {showInput && <InputPanel />}

      {/* 헤더 */}
      <div style={{ borderBottom: "1px solid #1e3a5f", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(6,14,26,0.95)", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(10px)", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{ width: 6, height: 32, borderRadius: 4, flexShrink: 0, background: "linear-gradient(180deg,#f97316,#38bdf8)" }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>BunkerBoard</div>
            <div style={{ fontSize: 10, color: "#475569", letterSpacing: "1.5px", textTransform: "uppercase" }}>Marine Fuel &amp; Crude</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexShrink: 0 }}>
          {mainTab === "dashboard" && (
            <button onClick={() => setShowInput(true)} style={{ background: "linear-gradient(135deg,#f97316,#38bdf8)", border: "none", borderRadius: 8, padding: "7px 14px", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>+ 가격 입력</button>
          )}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "1px" }}>USD/KRW</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: "#a3e635", whiteSpace: "nowrap" }}>{usdkrw ? `₩${usdkrw}` : "..."}</div>
          </div>
        </div>
      </div>

      {/* 메인 탭 */}
      <div style={{ borderBottom: "1px solid #1e3a5f", display: "flex", padding: "0 20px", background: "#060e1a", overflowX: "auto" }}>
        {([["dashboard", "📊 대시보드"], ["map", "🗺 지도"], ["straits", "🌊 해협"], ["news", "📰 뉴스"], ["knowledge", "📚 상식"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setMainTab(key)} style={{ padding: "12px 18px", border: "none", background: "transparent", color: mainTab === key ? "#f8fafc" : "#475569", borderBottom: mainTab === key ? "2px solid #38bdf8" : "2px solid transparent", fontSize: 13, fontWeight: mainTab === key ? 700 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", whiteSpace: "nowrap" }}>{label}</button>
        ))}
      </div>

      {mainTab === "dashboard" ? <DashboardTab />
        : mainTab === "map"       ? <DistanceTab />
        : mainTab === "straits"   ? <StraitsTab />
        : mainTab === "knowledge" ? <KnowledgeTab />
        : <NewsTab />}

      <div style={{ padding: "16px 20px 0", fontSize: 10, color: "#334155", textAlign: "center" }}>
        원유: Yahoo Finance 실시간 · 환율: ExchangeRate-API · S&B 가격: 1시간 캐시 · 뉴스: 링크 모음
      </div>

      {/* 맨 위로 스크롤 버튼 (400px 이상 스크롤 시 표시) */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="맨 위로"
        style={{
          position: "fixed",
          bottom: 24,
          right: 20,
          width: 48,
          height: 48,
          borderRadius: 24,
          border: "1px solid #1e3a5f",
          background: "linear-gradient(135deg,#0f2744,#0a1628)",
          color: "#f8fafc",
          fontSize: 20,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(56,189,248,0.15)",
          opacity: showScrollTop ? 1 : 0,
          pointerEvents: showScrollTop ? "auto" : "none",
          transform: showScrollTop ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.25s, transform 0.25s",
          zIndex: 50,
        }}
      >
        ↑
      </button>
    </div>
  );
}
