"use client";

import { useState, useMemo } from "react";
import { KNOWLEDGE, CATEGORIES, type KnowledgeCategory } from "@/lib/knowledge";

// body 텍스트의 **굵게** 변환 + 줄바꿈 처리
function renderBody(body: string): React.ReactNode {
  const lines = body.split("\n");
  return lines.map((line, i) => {
    // **bold** 패턴을 segment로 분리
    const segments = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = segments.map((seg, j) => {
      if (seg.startsWith("**") && seg.endsWith("**")) {
        return <strong key={j} style={{ color: "#f8fafc", fontWeight: 700 }}>{seg.slice(2, -2)}</strong>;
      }
      return <span key={j}>{seg}</span>;
    });
    return (
      <div key={i} style={{ minHeight: "1.6em" }}>
        {rendered}
      </div>
    );
  });
}

export default function KnowledgeTab() {
  const [activeCategory, setActiveCategory] = useState<"all" | KnowledgeCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return KNOWLEDGE.filter(entry => {
      if (activeCategory !== "all" && entry.category !== activeCategory) return false;
      if (!q) return true;
      return (
        entry.title.toLowerCase().includes(q) ||
        (entry.short ?? "").toLowerCase().includes(q) ||
        entry.body.toLowerCase().includes(q) ||
        (entry.tags ?? []).some(t => t.toLowerCase().includes(q))
      );
    });
  }, [activeCategory, searchQuery]);

  // 카테고리별 카운트
  const countByCategory = useMemo(() => {
    const m: Record<string, number> = { all: KNOWLEDGE.length };
    for (const c of CATEGORIES) m[c.id] = KNOWLEDGE.filter(e => e.category === c.id).length;
    return m;
  }, []);

  return (
    <div style={{ padding: "20px 20px 40px" }}>
      {/* 검색창 */}
      <div style={{ marginBottom: 14 }}>
        <input
          type="text"
          placeholder="검색 (제목·내용·태그)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "#060e1a",
            border: "1px solid #1e3a5f",
            borderRadius: 10,
            padding: "11px 14px",
            color: "#f8fafc",
            fontSize: 14,
            fontFamily: "inherit",
            outline: "none",
          }}
        />
      </div>

      {/* 카테고리 칩 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveCategory("all")}
          style={{
            padding: "6px 12px",
            borderRadius: 16,
            fontSize: 11,
            fontWeight: 600,
            border: `1px solid ${activeCategory === "all" ? "#38bdf8" : "#1e3a5f"}`,
            background: activeCategory === "all" ? "#38bdf822" : "transparent",
            color: activeCategory === "all" ? "#38bdf8" : "#475569",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          전체 {countByCategory.all}
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: "6px 12px",
              borderRadius: 16,
              fontSize: 11,
              fontWeight: 600,
              border: `1px solid ${activeCategory === cat.id ? cat.color : "#1e3a5f"}`,
              background: activeCategory === cat.id ? `${cat.color}22` : "transparent",
              color: activeCategory === cat.id ? cat.color : "#475569",
              cursor: "pointer",
              fontFamily: "inherit",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap",
            }}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
            <span style={{ opacity: 0.6, fontWeight: 400 }}>{countByCategory[cat.id]}</span>
          </button>
        ))}
      </div>

      {/* 결과 카운트 */}
      <div style={{ fontSize: 10, color: "#475569", marginBottom: 12 }}>
        {filtered.length === 0
          ? "검색 결과 없음"
          : `${filtered.length}개 항목${searchQuery ? ` · "${searchQuery}" 검색` : ""}`}
      </div>

      {/* 카드 목록 (아코디언) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(entry => {
          const cat = CATEGORIES.find(c => c.id === entry.category)!;
          const isExpanded = expandedId === entry.id;
          return (
            <div
              key={entry.id}
              style={{
                background: "#0a1628",
                border: `1px solid ${isExpanded ? cat.color + "55" : "#1e3a5f"}`,
                borderRadius: 10,
                overflow: "hidden",
                transition: "border-color 0.2s",
              }}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  padding: "14px 16px",
                  color: "#f8fafc",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{cat.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc", marginBottom: entry.short ? 4 : 0 }}>
                    {entry.title}
                  </div>
                  {entry.short && !isExpanded && (
                    <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>
                      {entry.short}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 14, color: "#475569", flexShrink: 0, transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
                  ▾
                </span>
              </button>
              {isExpanded && (
                <div style={{ padding: "0 16px 16px 42px", fontSize: 12, color: "#cbd5e1", lineHeight: 1.65, fontFamily: "inherit" }}>
                  {entry.short && (
                    <div style={{ fontSize: 11, color: cat.color, marginBottom: 10, paddingBottom: 10, borderBottom: "1px dashed #1e3a5f" }}>
                      {entry.short}
                    </div>
                  )}
                  <div>{renderBody(entry.body)}</div>
                  {entry.tags && entry.tags.length > 0 && (
                    <div style={{ marginTop: 12, display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {entry.tags.map(tag => (
                        <span key={tag} style={{ fontSize: 9, color: "#475569", background: "#0f1f38", padding: "2px 7px", borderRadius: 8, fontFamily: "monospace" }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 안내 */}
      <div style={{ marginTop: 24, padding: "14px 16px", background: "#0a1628", border: "1px dashed #1e3a5f", borderRadius: 10, fontSize: 10, color: "#475569", textAlign: "center", lineHeight: 1.6 }}>
        💡 정보는 일반적 시장 상식 — 실제 거래는 공식 자료(Platts, Argus 등) 및 전문가 자문 권장
      </div>
    </div>
  );
}
