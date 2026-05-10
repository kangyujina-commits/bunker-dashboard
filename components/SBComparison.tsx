"use client";

import { useEffect, useState, useCallback } from "react";

interface SBComparisonProps {
  myPrices: {
    [port: string]: {
      VLSFO: number | null;
      IFO380: number | null;
      LSMGO: number | null;
    };
  };
}

type Grade = "VLSFO" | "IFO380" | "LSMGO";

interface SBData {
  updatedAt: string;
  ports: Record<string, Record<Grade, number | null>>;
  errors: string[];
}

const GRADES: Grade[] = ["VLSFO", "IFO380", "LSMGO"];
const SB_PORTS = ["Singapore", "Fujairah", "Rotterdam", "Hong Kong", "LA/Long Beach"];

function formatTime(iso: string): string {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "방금 전";
  if (diff < 60) return `${diff}분 전`;
  const h = Math.floor(diff / 60);
  return `${h}시간 전`;
}

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
          <div style={{ height: 14, width: w, borderRadius: 4, background: "linear-gradient(90deg, #1e3a5f 25%, #0f2744 50%, #1e3a5f 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
        </td>
      ))}
    </tr>
  );
}

export default function SBComparison({ myPrices }: SBComparisonProps) {
  const [data, setData] = useState<SBData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGrade, setActiveGrade] = useState<Grade>("VLSFO");
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (noStore = false) => {
    try {
      setError(null);
      const res = await fetch("/api/sb-prices", {
        headers: noStore ? { "cache-control": "no-store" } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  };

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
          style={{
            padding: "5px 12px", borderRadius: 6, border: "1px solid #1e3a5f",
            background: "transparent", color: refreshing ? "#475569" : "#38bdf8",
            fontSize: 11, cursor: refreshing ? "not-allowed" : "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 5,
          }}
        >
          {refreshing ? "⟳ 갱신 중..." : "⟳ 새로고침"}
        </button>
      </div>

      {/* 등급 탭 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {GRADES.map((g) => (
          <button
            key={g}
            onClick={() => setActiveGrade(g)}
            style={{
              padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
              border: `1px solid ${activeGrade === g ? "#38bdf8" : "#1e3a5f"}`,
              background: activeGrade === g ? "#38bdf822" : "transparent",
              color: activeGrade === g ? "#38bdf8" : "#475569",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {g}
          </button>
        ))}
      </div>

      {/* 에러 상태 */}
      {error && !loading && (
        <div style={{ textAlign: "center", padding: "24px 16px", color: "#ef4444" }}>
          <div style={{ fontSize: 13, marginBottom: 12 }}>S&amp;B 가격 조회 실패. 잠시 후 다시 시도하세요.</div>
          <button onClick={handleRefresh} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #ef4444", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
            다시 시도
          </button>
        </div>
      )}

      {/* 비교 테이블 */}
      {!error && (
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
                    const sbVal = data?.ports[port]?.[activeGrade] ?? null;
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
      )}

      {/* 범례 */}
      {!loading && !error && (
        <div style={{ marginTop: 14, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: "#64748b" }}>■ 정상 (±$10 이하)</span>
          <span style={{ fontSize: 10, color: "#f59e0b" }}>⚠ 주의 ($10~$25)</span>
          <span style={{ fontSize: 10, color: "#ef4444" }}>⚠ 이상 ($25 초과)</span>
        </div>
      )}
    </div>
  );
}
