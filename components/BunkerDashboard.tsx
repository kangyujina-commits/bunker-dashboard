"use client";

import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import SBComparison from "./SBComparison";

const PRODUCT_COLORS: Record<string, string> = { "IFO 380": "#f97316", "VLSFO": "#38bdf8", "LS MGO": "#a3e635" };
const CRUDE_COLORS:   Record<string, string> = { "WTI": "#facc15", "Brent": "#c084fc", "Dubai": "#fb7185" };
const PRODUCTS = ["IFO 380", "VLSFO", "LS MGO"] as const;
const CRUDES   = ["WTI", "Brent", "Dubai"] as const;
const PORTS    = ["Singapore", "Fujairah", "Rotterdam", "Hong Kong", "LA/Long Beach"] as const;

type Product = typeof PRODUCTS[number];
type Crude   = typeof CRUDES[number];
type Port    = typeof PORTS[number];

const NEWS_SOURCES = {
  "Ship & Bunker": {
    color: "#f97316", icon: "⚓", description: "글로벌 벙커유 시장 전문 미디어",
    mainUrl: "https://shipandbunker.com/news",
    sections: [
      { label: "전체 뉴스",  url: "https://shipandbunker.com/news",                         desc: "최신 벙커유 전체 뉴스" },
      { label: "가격 뉴스",  url: "https://shipandbunker.com/news/am",                       desc: "아시아-중동 가격 동향" },
      { label: "Singapore", url: "https://shipandbunker.com/news/apac/sea",                  desc: "싱가포르 시장 뉴스" },
      { label: "Korea",     url: "https://shipandbunker.com/news/apac/nea/kr",               desc: "한국 시장 뉴스" },
      { label: "홍콩/중국",  url: "https://shipandbunker.com/news/apac/nea/hk",              desc: "홍콩·중국 시장 뉴스" },
      { label: "규제/IMO",  url: "https://shipandbunker.com/news/world/regulation",          desc: "IMO 규제 및 환경 이슈" },
    ],
  },
  "Platts / S&P Global": {
    color: "#38bdf8", icon: "📊", description: "S&P Global 원자재 인사이트",
    mainUrl: "https://www.spglobal.com/commodityinsights/en/market-insights/topics/marine-bunkers",
    sections: [
      { label: "Marine Bunkers",    url: "https://www.spglobal.com/commodityinsights/en/market-insights/topics/marine-bunkers",       desc: "Platts 벙커 마켓 인사이트" },
      { label: "Oil News",          url: "https://www.spglobal.com/commodityinsights/en/market-insights/latest-news/oil",             desc: "원유 시장 최신 뉴스" },
      { label: "LNG/Shipping",      url: "https://www.spglobal.com/commodityinsights/en/market-insights/topics/lng",                  desc: "LNG 및 해운 뉴스" },
      { label: "Price Assessments", url: "https://www.spglobal.com/commodityinsights/en/our-methodology/price-assessments",           desc: "Platts 가격 평가 방법론" },
    ],
  },
  "기타 참고 사이트": {
    color: "#a3e635", icon: "🌐", description: "에너지·해운 관련 주요 미디어",
    mainUrl: "https://gcaptain.com",
    sections: [
      { label: "gCaptain",         url: "https://gcaptain.com",                              desc: "해운·해양 산업 뉴스" },
      { label: "Hellenic Shipping", url: "https://www.hellenicshippingnews.com",             desc: "글로벌 해운 뉴스" },
      { label: "TradeWinds",       url: "https://www.tradewindsnews.com",                    desc: "해운 비즈니스 전문지" },
      { label: "Bunkerworld",      url: "https://www.bunkerworld.com",                       desc: "벙커유 가격 및 뉴스" },
      { label: "EIA Oil",          url: "https://www.eia.gov/petroleum/",                    desc: "미국 에너지정보청 원유 데이터" },
      { label: "OPEC News",        url: "https://www.opec.org/opec_web/en/press_room/",      desc: "OPEC 공식 보도자료" },
    ],
  },
};

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
  const [activeNewsSource, setActiveNewsSource] = useState<keyof typeof NEWS_SOURCES>("Ship & Bunker");
  const [crudeRange, setCrudeRange]             = useState(30);

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
    const src = NEWS_SOURCES[activeNewsSource];
    return (
      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {Object.entries(NEWS_SOURCES).map(([name, s]) => (
            <button key={name} onClick={() => setActiveNewsSource(name as keyof typeof NEWS_SOURCES)} style={{
              padding: "8px 14px", borderRadius: 8,
              border: `1px solid ${activeNewsSource === name ? s.color : "#1e3a5f"}`,
              background: activeNewsSource === name ? s.color + "18" : "transparent",
              color: activeNewsSource === name ? s.color : "#475569",
              cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
            }}>{s.icon} {name}</button>
          ))}
        </div>
        <Card style={{ marginBottom: 16, border: `1px solid ${src.color}33` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: src.color, marginBottom: 4 }}>{src.icon} {activeNewsSource}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{src.description}</div>
            </div>
            <a href={src.mainUrl} target="_blank" rel="noreferrer" style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${src.color}`, color: src.color, fontSize: 12, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>사이트 바로가기 →</a>
          </div>
        </Card>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {src.sections.map((section, i) => (
            <a key={i} href={section.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
              <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 10, padding: "16px 18px", cursor: "pointer", transition: "all 0.15s", height: "100%", boxSizing: "border-box" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = src.color; (e.currentTarget as HTMLDivElement).style.background = "#0f1f38"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#1e3a5f"; (e.currentTarget as HTMLDivElement).style.background = "#0a1628"; }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", marginBottom: 6 }}>{section.label}</div>
                <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4, marginBottom: 10 }}>{section.desc}</div>
                <div style={{ fontSize: 10, color: src.color, opacity: 0.7 }}>열기 →</div>
              </div>
            </a>
          ))}
        </div>
        <div style={{ marginTop: 20, padding: "14px 16px", background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 10, fontSize: 11, color: "#334155", textAlign: "center" }}>
          💡 배포 후 업그레이드 예정 — 실시간 뉴스 자동 수집 (RSS 서버사이드 처리)
        </div>
      </div>
    );
  };

  // ── 대시보드 탭 ───────────────────────────────────
  const CrudeCard = ({ c }: { c: Crude }) => {
    const delta = getCrudeDelta(c);
    return (
      <Card style={{ border: `1px solid ${CRUDE_COLORS[c]}44`, overflow: "hidden", minWidth: 0 }}>
        <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c}</div>
        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color: CRUDE_COLORS[c], lineHeight: 1.1, whiteSpace: "nowrap" }}>
          {crudeLoading ? "..." : crudePrice[c] ? `$${crudePrice[c]}` : "—"}
        </div>
        <div style={{ fontSize: 11, color: delta.up ? "#f97316" : "#38bdf8", marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {delta.text} <span style={{ color: "#475569" }}>vs 전일</span>
        </div>
        {c === "Dubai" && <div style={{ fontSize: 10, color: "#334155", marginTop: 3 }}>
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
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>원유 가격 추이</div>
            <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>USD/bbl · Yahoo Finance</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {([["30일", 30], ["1년", 365]] as const).map(([label, val]) => (
              <button key={val} onClick={() => setCrudeRange(val)} style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${crudeRange === val ? "#38bdf8" : "#1e3a5f"}`, background: crudeRange === val ? "#38bdf822" : "transparent", color: crudeRange === val ? "#38bdf8" : "#475569", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>{label}</button>
            ))}
          </div>
        </div>
        {crudeLoading
          ? <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}>로딩 중...</div>
          : <ResponsiveContainer width="100%" height={200}>
              <LineChart data={crudeHistory.slice(-crudeRange)}>
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
              </LineChart>
            </ResponsiveContainer>
        }
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
      <div style={{ borderBottom: "1px solid #1e3a5f", display: "flex", padding: "0 20px", background: "#060e1a" }}>
        {([["dashboard", "📊 대시보드"], ["news", "📰 뉴스"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setMainTab(key)} style={{ padding: "12px 20px", border: "none", background: "transparent", color: mainTab === key ? "#f8fafc" : "#475569", borderBottom: mainTab === key ? "2px solid #38bdf8" : "2px solid transparent", fontSize: 13, fontWeight: mainTab === key ? 700 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>{label}</button>
        ))}
      </div>

      {mainTab === "dashboard" ? <DashboardTab /> : <NewsTab />}

      <div style={{ padding: "16px 20px 0", fontSize: 10, color: "#334155", textAlign: "center" }}>
        원유: Yahoo Finance 실시간 · 환율: ExchangeRate-API · S&B 가격: 1시간 캐시 · 뉴스: 링크 모음
      </div>
    </div>
  );
}
