"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, useMap } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

import { STRAITS, REGION_META, TYPE_META, type Strait } from "@/lib/straits";

// body 텍스트 → React node (**bold** + 줄바꿈)
function renderBody(body: string): React.ReactNode {
  const lines = body.split("\n");
  return lines.map((line, i) => {
    const segments = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = segments.map((seg, j) => {
      if (seg.startsWith("**") && seg.endsWith("**")) {
        return <strong key={j} style={{ color: "#f8fafc", fontWeight: 700 }}>{seg.slice(2, -2)}</strong>;
      }
      return <span key={j}>{seg}</span>;
    });
    return <div key={i} style={{ minHeight: "1.5em" }}>{rendered}</div>;
  });
}

// 지도 외부에서 특정 strait으로 flyTo 시키는 헬퍼
function FlyToStrait({ target }: { target: Strait | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target.coords, 5, { duration: 0.8 });
    }
  }, [target, map]);
  return null;
}

export default function StraitsTab() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<"all" | Strait["region"]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const mapRef = useRef<LeafletMap | null>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return STRAITS.filter(s => {
      if (activeRegion !== "all" && s.region !== activeRegion) return false;
      if (!q) return true;
      return (
        s.nameKr.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.connects.join(" ").toLowerCase().includes(q)
      );
    });
  }, [activeRegion, searchQuery]);

  const selected = STRAITS.find(s => s.id === selectedId) ?? null;

  const handleCardClick = (id: string) => {
    setSelectedId(id);
    // 카드 클릭 시 지도가 그쪽으로 이동
  };

  return (
    <div style={{ padding: "16px 16px 40px" }}>
      {/* 지도 */}
      <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 16, border: "1px solid #1e3a5f", height: 360 }}>
        <MapContainer
          center={[20, 60]}
          zoom={2}
          minZoom={2}
          worldCopyJump
          style={{ height: "100%", width: "100%", background: "#060e1a" }}
          ref={(m) => { if (m) mapRef.current = m; }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <FlyToStrait target={selected} />
          {STRAITS.map(s => {
            const meta = REGION_META[s.region];
            const isSelected = selectedId === s.id;
            return (
              <CircleMarker
                key={s.id}
                center={s.coords}
                radius={isSelected ? 11 : 7}
                pathOptions={{
                  color: meta.color,
                  fillColor: meta.color,
                  fillOpacity: isSelected ? 0.85 : 0.55,
                  weight: isSelected ? 3 : 1.5,
                }}
                eventHandlers={{
                  click: () => setSelectedId(s.id),
                }}
              >
                <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent={false} sticky>
                  <div style={{ background: "#0a1628", padding: "5px 9px", borderRadius: 6, border: `1px solid ${meta.color}`, fontFamily: "inherit" }}>
                    <div style={{ color: "#f8fafc", fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>
                      {TYPE_META[s.type].icon} {s.nameKr}
                    </div>
                    <div style={{ color: meta.color, fontSize: 9, fontWeight: 500, marginTop: 2, lineHeight: 1.1 }}>
                      {s.nameEn}
                    </div>
                  </div>
                </Tooltip>
                <Popup>
                  <div style={{ minWidth: 200, fontFamily: "inherit" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#060e1a", marginBottom: 2 }}>
                      {TYPE_META[s.type].icon} {s.nameKr}
                    </div>
                    <div style={{ fontSize: 10, color: "#475569", marginBottom: 6 }}>
                      {s.nameEn}
                    </div>
                    <div style={{ fontSize: 11, color: "#1e293b", marginBottom: 4 }}>
                      <strong>연결:</strong> {s.connects.join(" ↔ ")}
                    </div>
                    <div style={{ fontSize: 11, color: "#1e293b" }}>
                      <strong>특징:</strong> {s.importance}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* 검색 */}
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="해협·운하 검색 (한글·영문·연결 수역)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box",
            background: "#060e1a", border: "1px solid #1e3a5f", borderRadius: 10,
            padding: "10px 14px", color: "#f8fafc", fontSize: 13,
            fontFamily: "inherit", outline: "none",
          }}
        />
      </div>

      {/* 지역 필터 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveRegion("all")}
          style={{
            padding: "5px 11px", borderRadius: 14, fontSize: 11, fontWeight: 600,
            border: `1px solid ${activeRegion === "all" ? "#38bdf8" : "#1e3a5f"}`,
            background: activeRegion === "all" ? "#38bdf822" : "transparent",
            color: activeRegion === "all" ? "#38bdf8" : "#475569",
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          전체 {STRAITS.length}
        </button>
        {(Object.entries(REGION_META) as Array<[Strait["region"], typeof REGION_META["asia"]]>).map(([region, meta]) => {
          const count = STRAITS.filter(s => s.region === region).length;
          if (count === 0) return null;
          const active = activeRegion === region;
          return (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              style={{
                padding: "5px 11px", borderRadius: 14, fontSize: 11, fontWeight: 600,
                border: `1px solid ${active ? meta.color : "#1e3a5f"}`,
                background: active ? `${meta.color}22` : "transparent",
                color: active ? meta.color : "#475569",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {meta.label} {count}
            </button>
          );
        })}
      </div>

      {/* 선택된 strait 상세 패널 */}
      {selected && (
        <div style={{ background: "#0a1628", border: `1px solid ${REGION_META[selected.region].color}66`, borderRadius: 12, padding: "16px 18px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc" }}>
                {TYPE_META[selected.type].icon} {selected.nameKr}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                {selected.nameEn}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 10, background: `${REGION_META[selected.region].color}22`, color: REGION_META[selected.region].color, fontWeight: 600 }}>
                {REGION_META[selected.region].label}
              </span>
              <button onClick={() => setSelectedId(null)} style={{ background: "transparent", border: "none", color: "#475569", fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10, fontSize: 11 }}>
            <div><span style={{ color: "#475569" }}>크기:</span> <span style={{ color: "#cbd5e1", fontFamily: "monospace" }}>{selected.width}</span></div>
            <div><span style={{ color: "#475569" }}>연결:</span> <span style={{ color: "#cbd5e1" }}>{selected.connects.join(" ↔ ")}</span></div>
          </div>

          <div style={{ fontSize: 12, color: REGION_META[selected.region].color, fontWeight: 600, marginBottom: 12, padding: "8px 10px", background: "#060e1a", borderRadius: 6 }}>
            💡 {selected.importance}
          </div>

          <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.7 }}>
            {renderBody(selected.description)}
          </div>

          {selected.risk && (
            <div style={{ marginTop: 12, padding: "8px 10px", background: "#1f0f15", border: "1px solid #ef444466", borderRadius: 6, fontSize: 11, color: "#fca5a5", lineHeight: 1.5 }}>
              <strong style={{ color: "#ef4444" }}>⚠ 리스크</strong> · {selected.risk}
            </div>
          )}
        </div>
      )}

      {/* 카드 리스트 */}
      <div style={{ fontSize: 10, color: "#475569", marginBottom: 8 }}>
        {filtered.length === 0 ? "검색 결과 없음" : `${filtered.length}개 항목`}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
        {filtered.map(s => {
          const meta = REGION_META[s.region];
          const isSelected = selectedId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => handleCardClick(s.id)}
              style={{
                textAlign: "left",
                background: isSelected ? "#0f2744" : "#0a1628",
                border: `1px solid ${isSelected ? meta.color : "#1e3a5f"}`,
                borderRadius: 10,
                padding: "10px 12px",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc", marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}>
                <span>{TYPE_META[s.type].icon}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.nameKr}</span>
              </div>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.nameEn}
              </div>
              <div style={{ fontSize: 9, color: meta.color, fontWeight: 600 }}>
                {meta.label} · {TYPE_META[s.type].label}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 20, padding: "12px 14px", background: "#0a1628", border: "1px dashed #1e3a5f", borderRadius: 10, fontSize: 10, color: "#475569", textAlign: "center", lineHeight: 1.6 }}>
        💡 지도의 동그라미를 누르면 짧은 정보 · 카드 누르면 상세 + 지도 줌인
      </div>
    </div>
  );
}
