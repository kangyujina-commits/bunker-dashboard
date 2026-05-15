"use client";

import { useState, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { PORTS, PRESET_ROUTES, DEFAULT_SPEED_KNOTS } from "../lib/ports";
import { calculateRoute, formatPassage } from "../lib/calculateRoute";

// 다크 테마 마커 아이콘
const createMarkerIcon = (label: string, color: string) =>
  L.divIcon({
    html: `<div style="background:${color}; color:#060e1a; border-radius:50%; width:26px; height:26px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; border:2px solid #0a1628; box-shadow:0 0 0 1px ${color}, 0 2px 8px rgba(0,0,0,0.6);">${label}</div>`,
    className: "port-marker",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

function FitBounds({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates && coordinates.length > 1) {
      map.fitBounds(coordinates, { padding: [40, 40] });
    }
  }, [coordinates, map]);
  return null;
}

export default function DistanceTab() {
  const [fromCode, setFromCode] = useState("FJR");
  const [toCode, setToCode] = useState("SIN");
  const [speed, setSpeed] = useState(DEFAULT_SPEED_KNOTS);
  const [copied, setCopied] = useState(false);

  const route = useMemo(() => calculateRoute(fromCode, toCode, speed), [fromCode, toCode, speed]);
  const fromPort = PORTS[fromCode];
  const toPort = PORTS[toCode];

  const handleSwap = () => { setFromCode(toCode); setToCode(fromCode); };
  const handlePreset = (from: string, to: string) => { setFromCode(from); setToCode(to); };

  const handleCopy = () => {
    const text = `${fromPort.full} → ${toPort.full}\n${route.distanceNM.toLocaleString()} NM, ${route.days.toFixed(1)} days @ ${speed} kn${route.passages.length ? "\nVia: " + route.passages.map(formatPassage).join(", ") : ""}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const card: React.CSSProperties = {
    background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 12, padding: "14px 16px",
  };
  const selectStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "8px 12px", fontSize: 14,
    background: "#060e1a", color: "#f1f5f9", border: "1px solid #1e3a5f", borderRadius: 8,
    fontFamily: "inherit", cursor: "pointer",
  };

  return (
    <div style={{ padding: "24px 20px 0" }}>
      {/* 프리셋 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 8 }}>Quick Routes</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {PRESET_ROUTES.map(({ from, to, label }) => {
            const active = fromCode === from && toCode === to;
            return (
              <button key={`${from}-${to}`} onClick={() => handlePreset(from, to)} style={{
                padding: "7px 13px", borderRadius: 8,
                border: `1px solid ${active ? "#38bdf8" : "#1e3a5f"}`,
                background: active ? "#38bdf822" : "transparent",
                color: active ? "#38bdf8" : "#94a3b8",
                cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
              }}>⚡ {label}</button>
            );
          })}
        </div>
      </div>

      {/* From/To */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "end", marginBottom: 14 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>From</label>
          <select value={fromCode} onChange={e => setFromCode(e.target.value)} style={selectStyle}>
            {Object.entries(PORTS).map(([code, p]) => <option key={code} value={code}>{p.full}</option>)}
          </select>
        </div>
        <button onClick={handleSwap} title="Swap" style={{
          width: 40, height: 40, borderRadius: 8, border: "1px solid #1e3a5f",
          background: "#0a1628", color: "#94a3b8", cursor: "pointer", fontSize: 18, fontFamily: "inherit",
        }}>⇄</button>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>To</label>
          <select value={toCode} onChange={e => setToCode(e.target.value)} style={selectStyle}>
            {Object.entries(PORTS).map(([code, p]) => <option key={code} value={code}>{p.full}</option>)}
          </select>
        </div>
      </div>

      {/* 속도 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <label style={{ fontSize: 11, color: "#94a3b8" }}>Vessel speed</label>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#38bdf8", fontFamily: "monospace" }}>{speed} knots</span>
        </div>
        <input type="range" min="8" max="22" step="0.5" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: "#38bdf8" }} />
      </div>

      {/* 결과 */}
      {route.error ? (
        <div style={{ ...card, color: "#fb7185", borderColor: "#fb718544", marginBottom: 14 }}>⚠️ {route.error}</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
            <div style={card}>
              <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 6 }}>Distance</div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color: "#38bdf8", lineHeight: 1.1 }}>
                {route.distanceNM.toLocaleString()}<span style={{ fontSize: 11, color: "#475569", marginLeft: 6, fontWeight: 400 }}>NM</span>
              </div>
            </div>
            <div style={card}>
              <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 6 }}>Sailing time</div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color: "#a3e635", lineHeight: 1.1 }}>
                {route.days.toFixed(1)}<span style={{ fontSize: 11, color: "#475569", marginLeft: 6, fontWeight: 400 }}>days</span>
              </div>
            </div>
            <div style={card}>
              <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 6 }}>Via</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", lineHeight: 1.3 }}>
                {route.passages.length ? route.passages.map(formatPassage).join(", ") : "Direct"}
              </div>
            </div>
          </div>

          {/* 지도 */}
          <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #1e3a5f", marginBottom: 14, background: "#0a1628" }}>
            <MapContainer
              center={[20, 70]}
              zoom={2}
              style={{ height: 400, width: "100%", background: "#0a1628" }}
              worldCopyJump
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                maxZoom={19}
              />
              {route.coordinates.length > 0 && fromPort && toPort && (
                <>
                  <Polyline
                    positions={route.coordinates}
                    pathOptions={{ color: "#38bdf8", weight: 3, opacity: 0.9, dashArray: "6, 4" }}
                  />
                  <Marker position={[fromPort.coords[1], fromPort.coords[0]]} icon={createMarkerIcon("A", "#38bdf8")}>
                    <Tooltip>{fromPort.full}</Tooltip>
                  </Marker>
                  <Marker position={[toPort.coords[1], toPort.coords[0]]} icon={createMarkerIcon("B", "#a3e635")}>
                    <Tooltip>{toPort.full}</Tooltip>
                  </Marker>
                  <FitBounds coordinates={route.coordinates} />
                </>
              )}
            </MapContainer>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={handleCopy} style={{
              padding: "8px 14px", borderRadius: 8, border: "1px solid #1e3a5f",
              background: copied ? "#a3e63522" : "#0a1628",
              color: copied ? "#a3e635" : "#94a3b8",
              cursor: "pointer", fontSize: 12, fontFamily: "inherit", transition: "all 0.2s",
            }}>{copied ? "✓ 복사됨" : "📋 결과 복사"}</button>
          </div>
        </>
      )}
    </div>
  );
}
