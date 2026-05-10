"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ── 타입 ──────────────────────────────────────────────
interface SBEntry {
  date: string;
  dateISO: string;
  price: number;
}

type Grade = "VLSFO" | "IFO380" | "LSMGO";

interface SBData {
  updatedAt: string;
  ports: Record<string, Record<Grade, SBEntry[]>>;
  errors: string[];
}

type PlattsDailyHistory = Record<
  string,
  Record<string, { VLSFO: number | null; IFO380: number | null; LSMGO: number | null }>
>;

interface TrendPoint {
  date: string;
  dateISO: string;
  SB: number | null;
  Platts: number | null;
}

// ── 상수 ──────────────────────────────────────────────
const GRADES: Grade[] = ["VLSFO", "IFO380", "LSMGO"];
const SB_PORTS = ["Singapore", "Fujairah", "Rotterdam", "Hong Kong", "LA/Long Beach"];

// ── 헬퍼 ──────────────────────────────────────────────
function formatTime(iso: string): string {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "방금 전";
  if (diff < 60) return `${diff}분 전`;
  return `${Math.floor(diff / 60)}시간 전`;
}

function getLatest(entries: SBEntry[]): number | null {
  return entries[0]?.price ?? null;
}

function buildTrendData(
  sbData: SBData,
  plattsHistory: PlattsDailyHistory,
  port: string,
  grade: Grade
): TrendPoint[] {
  const sbHistory = sbData.ports[port]?.[grade] ?? [];

  // 날짜 집합: S&B + Platts 기록 합산 (S&B 페이지가 제공하는 만큼 전부 ~11일)
  const dateSet = new Set<string>([
    ...sbHistory.map((e) => e.dateISO),
    ...Object.keys(plattsHistory),
  ]);
  const dates = [...dateSet].sort();

  const sbByDate = new Map(sbHistory.map((e) => [e.dateISO, e.price]));
  const sbByShort = new Map(sbHistory.map((e) => [e.dateISO, e.date]));

  return dates.map((iso) => {
    const d = new Date(iso);
    const displayDate = sbByShort.get(iso) ?? `${d.getMonth() + 1}/${d.getDate()}`;
    return {
      date: displayDate,
      dateISO: iso,
      SB: sbByDate.get(iso) ?? null,
      Platts: plattsHistory[iso]?.[port]?.[grade] ?? null,
    };
  });
}

// ── 서브 컴포넌트 ──────────────────────────────────────
function DiffCell({ my, sb }: { my: number | null; sb: number | null }) {
  if (my === null || sb === null) return <span style={{ color: "#475569" }}>—</span>;
  const diff = my - sb;
  const abs = Math.abs(diff);
  let color = "#64748b";
  let icon = "";
  if (abs > 25) { color = "#ef4444"; icon = " ⚠"; }
  else if (abs > 10) { color = "#f59e0b"; icon = " ⚠"; }
  return (
    <span style={{ color, fontFamily: "monospace", fontWeight: 600 }}>
      {diff > 0 ? "+" : ""}{diff.toFixed(1)}{icon}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {[120, 90, 90, 100].map((w, i) => (
        <td key={i} style={{ padding: "12px 16px" }}>
          <div style={{ height: 14, width: w, borderRadius: 4, background: "linear-gradient(90deg,#1e3a5f 25%,#0f2744 50%,#1e3a5f 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
        </td>
      ))}
    </tr>
  );
}

const TrendTooltip = ({
  active, payload, label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number | null; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const sb = payload.find((p) => p.name === "SB")?.value;
  const pl = payload.find((p) => p.name === "Platts")?.value;
  const diff = sb != null && pl != null ? pl - sb : null;
  return (
    <div style={{ background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#e2e8f0" }}>
      <p style={{ marginBottom: 6, color: "#94a3b8", fontFamily: "monospace" }}>{label}</p>
      {sb != null && <p style={{ color: "#38bdf8", margin: "2px 0" }}>S&B: <strong>${sb}</strong></p>}
      {pl != null && <p style={{ color: "#a3e635", margin: "2px 0" }}>Platts: <strong>${pl}</strong></p>}
      {diff != null && (
        <p style={{ color: Math.abs(diff) > 25 ? "#ef4444" : Math.abs(diff) > 10 ? "#f59e0b" : "#64748b", margin: "4px 0 0", borderTop: "1px solid #1e3a5f", paddingTop: 4 }}>
          차이: {diff > 0 ? "+" : ""}{diff.toFixed(1)}
        </p>
      )}
    </div>
  );
};

// ── 메인 컴포넌트 ──────────────────────────────────────
interface SBComparisonProps {
  myPrices: Record<string, { VLSFO: number | null; IFO380: number | null; LSMGO: number | null }>;
}

export default function SBComparison({ myPrices }: SBComparisonProps) {
  const [data, setData]               = useState<SBData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [activeGrade, setActiveGrade] = useState<Grade>("VLSFO");
  const [refreshing, setRefreshing]   = useState(false);
  const [viewMode, setViewMode]       = useState<"table" | "trend">("table");
  const [trendPort, setTrendPort]     = useState("Singapore");
  const [trendRange, setTrendRange]   = useState<30 | 90 | 0>(30); // 0 = 전체
  const [plattsHistory, setPlattsHistory] = useState<PlattsDailyHistory>({});

  // localStorage에서 Platts 이력 로드
  const loadPlattsHistory = useCallback(() => {
    try {
      const raw = localStorage.getItem("bb_platts_history");
      if (raw) setPlattsHistory(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // 3개 소스 병합:
  // 1. /sb-history.json (GitHub Actions cron이 매일 누적, 다중 기기 공유)
  // 2. /api/sb-prices (실시간, 최근 ~11일)
  // 3. localStorage (이 기기에서만 누적된 추가분, offline 대비)
  // 우선순위: API(실시간) > 정적 파일 > localStorage. 같은 날짜는 우선순위 높은 게 덮어씀.
  const fetchData = useCallback(async (noStore = false) => {
    setError(null);
    type StoredPorts = Record<string, Record<Grade, SBEntry[]>>;

    const [staticRes, apiRes] = await Promise.allSettled([
      fetch("/sb-history.json", noStore ? { cache: "no-store" } : {}).then(r => r.ok ? r.json() : null),
      fetch("/api/sb-prices", { headers: noStore ? { "cache-control": "no-store" } : {} }).then(r => r.ok ? r.json() : null),
    ]);

    const staticData = staticRes.status === "fulfilled" ? staticRes.value as { ports?: StoredPorts } | null : null;
    const apiData    = apiRes.status    === "fulfilled" ? apiRes.value    as SBData | null            : null;

    let localData: StoredPorts = {};
    try {
      const raw = localStorage.getItem("bb_sb_history");
      if (raw) localData = JSON.parse(raw);
    } catch { /* ignore */ }

    // 모든 포트 모음
    const allPorts = new Set<string>([
      ...Object.keys(localData),
      ...Object.keys(staticData?.ports ?? {}),
      ...Object.keys(apiData?.ports ?? {}),
    ]);

    if (allPorts.size === 0) {
      setError("S&B 데이터를 불러오지 못했습니다.");
      return;
    }

    const mergedPorts: StoredPorts = {};
    for (const port of allPorts) {
      const portMerged: Record<Grade, SBEntry[]> = { VLSFO: [], IFO380: [], LSMGO: [] };
      for (const grade of GRADES) {
        const map = new Map<string, SBEntry>();
        // 우선순위 낮은 → 높은 순으로 set (나중에 set한 게 덮어씀)
        (localData[port]?.[grade]            ?? []).forEach(e => map.set(e.dateISO, e));
        (staticData?.ports?.[port]?.[grade]  ?? []).forEach(e => map.set(e.dateISO, e));
        (apiData?.ports?.[port]?.[grade]     ?? []).forEach(e => map.set(e.dateISO, e));
        portMerged[grade] = [...map.values()].sort((a, b) => b.dateISO.localeCompare(a.dateISO));
      }
      mergedPorts[port] = portMerged;
    }

    // localStorage에도 저장 (다음번 offline 대비)
    try {
      localStorage.setItem("bb_sb_history", JSON.stringify(mergedPorts));
    } catch { /* quota */ }

    const updatedAt = apiData?.updatedAt ?? new Date().toISOString();
    setData({ updatedAt, ports: mergedPorts, errors: apiData ? [] : ["API 실패 — 정적/캐시 데이터 사용"] });
  }, []);

  useEffect(() => {
    loadPlattsHistory();
    fetchData().finally(() => setLoading(false));
  }, [fetchData, loadPlattsHistory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    loadPlattsHistory();
    await fetchData(true);
    setRefreshing(false);
  };

  // 추이 차트 데이터 (누적 history 전체)
  const allTrendData: TrendPoint[] = data
    ? buildTrendData(data, plattsHistory, trendPort, activeGrade)
    : [];
  // 범위 슬라이스 (0=전체)
  const trendData: TrendPoint[] = trendRange === 0
    ? allTrendData
    : allTrendData.slice(-trendRange);

  const hasPlattsHistory = trendData.some((d) => d.Platts !== null);
  const totalDaysAccumulated = allTrendData.length;

  return (
    <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 12, padding: "20px", marginTop: 16 }}>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>Platts vs Ship &amp; Bunker 비교</div>
          <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>
            {data ? `갱신: ${formatTime(data.updatedAt)}` : "로딩 중..."}
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #1e3a5f", background: "transparent", color: refreshing ? "#475569" : "#38bdf8", fontSize: 11, cursor: refreshing ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}
        >
          {refreshing ? "⟳ 갱신 중..." : "⟳ 새로고침"}
        </button>
      </div>

      {/* 등급 탭 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {GRADES.map((g) => (
          <button key={g} onClick={() => setActiveGrade(g)} style={{ padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: `1px solid ${activeGrade === g ? "#38bdf8" : "#1e3a5f"}`, background: activeGrade === g ? "#38bdf822" : "transparent", color: activeGrade === g ? "#38bdf8" : "#475569", cursor: "pointer", fontFamily: "inherit" }}>
            {g}
          </button>
        ))}
      </div>

      {/* 뷰 토글 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {([["table", "현재 비교"], ["trend", "최근 추이"]] as const).map(([mode, label]) => (
          <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: "5px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600, border: `1px solid ${viewMode === mode ? "#f97316" : "#1e3a5f"}`, background: viewMode === mode ? "#f9731622" : "transparent", color: viewMode === mode ? "#f97316" : "#475569", cursor: "pointer", fontFamily: "inherit" }}>
            {label}
          </button>
        ))}
      </div>

      {/* 에러 */}
      {error && !loading && (
        <div style={{ textAlign: "center", padding: "24px 16px", color: "#ef4444" }}>
          <div style={{ fontSize: 13, marginBottom: 12 }}>S&amp;B 가격 조회 실패. 잠시 후 다시 시도하세요.</div>
          <button onClick={handleRefresh} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #ef4444", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>다시 시도</button>
        </div>
      )}

      {!error && (
        <>
          {/* ── 현재 비교 테이블 ── */}
          {viewMode === "table" && (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1e3a5f" }}>
                      {["포트", "내 입력 (Platts)", "Ship & Bunker", "차이 (Platts − S&B)"].map((h) => (
                        <th key={h} style={{ padding: "8px 16px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? SB_PORTS.map((p) => <SkeletonRow key={p} />)
                      : SB_PORTS.map((port) => {
                          const myVal = myPrices[port]?.[activeGrade] ?? null;
                          const sbVal = getLatest(data?.ports[port]?.[activeGrade] ?? []);
                          return (
                            <tr key={port} style={{ borderBottom: "1px solid #0f2744" }}>
                              <td style={{ padding: "12px 16px", color: "#e2e8f0", fontWeight: 500 }}>{port}</td>
                              <td style={{ padding: "12px 16px", fontFamily: "monospace", color: myVal !== null ? "#a3e635" : "#475569" }}>
                                {myVal !== null ? `$${myVal.toFixed(1)}` : "—"}
                              </td>
                              <td style={{ padding: "12px 16px", fontFamily: "monospace", color: sbVal !== null ? "#38bdf8" : "#475569" }}>
                                {sbVal !== null ? `$${sbVal.toFixed(1)}` : "—"}
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <DiffCell my={myVal} sb={sbVal} />
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
              {!loading && (
                <div style={{ marginTop: 14, display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, color: "#64748b" }}>■ 정상 (±$10 이하)</span>
                  <span style={{ fontSize: 10, color: "#f59e0b" }}>⚠ 주의 ($10~$25)</span>
                  <span style={{ fontSize: 10, color: "#ef4444" }}>⚠ 이상 ($25 초과)</span>
                </div>
              )}
            </>
          )}

          {/* ── 추이 차트 ── */}
          {viewMode === "trend" && (
            <>
              {/* 포트 선택 */}
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                {SB_PORTS.map((port) => (
                  <button key={port} onClick={() => setTrendPort(port)} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, border: `1px solid ${trendPort === port ? "#38bdf8" : "#1e3a5f"}`, background: trendPort === port ? "#38bdf822" : "transparent", color: trendPort === port ? "#38bdf8" : "#475569", cursor: "pointer", fontFamily: "inherit" }}>
                    {port}
                  </button>
                ))}
              </div>

              {/* 범위 선택 + 누적량 표시 */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 8, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {([["30일", 30], ["90일", 90], ["전체", 0]] as const).map(([label, val]) => (
                    <button key={val} onClick={() => setTrendRange(val)} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 10, border: `1px solid ${trendRange === val ? "#f97316" : "#1e3a5f"}`, background: trendRange === val ? "#f9731622" : "transparent", color: trendRange === val ? "#f97316" : "#475569", cursor: "pointer", fontFamily: "inherit" }}>
                      {label}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: "#475569" }}>
                  누적: <span style={{ color: "#94a3b8", fontFamily: "monospace" }}>{totalDaysAccumulated}일치</span>
                </div>
              </div>

              {loading ? (
                <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: 12 }}>
                  로딩 중...
                </div>
              ) : trendData.length === 0 ? (
                <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: 12 }}>
                  데이터 없음
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#475569" }} tickLine={false} axisLine={false} interval={trendData.length > 60 ? Math.floor(trendData.length / 8) : trendData.length > 20 ? Math.floor(trendData.length / 6) : "preserveEnd"} />
                      <YAxis tick={{ fontSize: 9, fill: "#475569" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} width={44} />
                      <Tooltip content={<TrendTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8", paddingTop: 6 }} />
                      <Line type="monotone" dataKey="SB" name="SB" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3, fill: "#38bdf8" }} connectNulls={false} />
                      <Line type="monotone" dataKey="Platts" name="Platts" stroke="#a3e635" strokeWidth={2} dot={{ r: 4, fill: "#a3e635" }} connectNulls={false} strokeDasharray={hasPlattsHistory ? undefined : "4 4"} />
                    </LineChart>
                  </ResponsiveContainer>

                  {!hasPlattsHistory && (
                    <div style={{ marginTop: 8, padding: "8px 12px", background: "#0f1f38", borderRadius: 6, fontSize: 10, color: "#475569", textAlign: "center" }}>
                      내 Platts 입력 이력 없음 — 상단 &ldquo;+ 가격 입력 → 포트별&rdquo;에서 저장하면 추이가 표시됩니다
                    </div>
                  )}

                  {/* 날짜별 상세 테이블 */}
                  <div style={{ marginTop: 16, overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #1e3a5f" }}>
                          {["날짜", "S&B", "내 입력", "차이"].map((h) => (
                            <th key={h} style={{ padding: "6px 12px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 10 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...trendData].reverse().map((row) => (
                          <tr key={row.dateISO} style={{ borderBottom: "1px solid #0f2744" }}>
                            <td style={{ padding: "8px 12px", color: "#94a3b8", fontFamily: "monospace" }}>{row.date}</td>
                            <td style={{ padding: "8px 12px", fontFamily: "monospace", color: row.SB !== null ? "#38bdf8" : "#475569" }}>
                              {row.SB !== null ? `$${row.SB.toFixed(1)}` : "—"}
                            </td>
                            <td style={{ padding: "8px 12px", fontFamily: "monospace", color: row.Platts !== null ? "#a3e635" : "#475569" }}>
                              {row.Platts !== null ? `$${row.Platts.toFixed(1)}` : "—"}
                            </td>
                            <td style={{ padding: "8px 12px" }}>
                              <DiffCell my={row.Platts} sb={row.SB} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
