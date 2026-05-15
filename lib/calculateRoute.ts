import { seaRoute } from "searoute-ts";
import { PORTS } from "./ports";

// 해협/운하 바운딩 박스 (lng/lat). 경로 좌표가 박스 내에 들어가면 통과로 판정.
// 박스 형식: [minLng, minLat, maxLng, maxLat]
// 나중에 turf 폴리곤 체크로 교체 가능 (detectStraits 내부만 수정).
const STRAITS: { name: string; bbox: [number, number, number, number] }[] = [
  { name: "호르무즈",       bbox: [56.0, 26.0, 57.5, 27.5] },
  { name: "Bab-el-Mandeb",  bbox: [42.8, 12.0, 43.8, 13.2] },
  { name: "수에즈",         bbox: [32.3, 29.5, 32.8, 31.5] },
  { name: "9°채널",         bbox: [72.5, 8.5, 73.7, 9.5] },
  { name: "8°채널",         bbox: [72.5, 7.5, 73.7, 8.5] },
  { name: "말라카",         bbox: [98.0, 1.0, 104.0, 5.5] },
  { name: "순다",           bbox: [105.5, -6.7, 106.5, -5.5] },
  { name: "롬복",           bbox: [115.4, -8.9, 116.2, -8.2] },
  { name: "대만해협",       bbox: [118.0, 23.0, 121.0, 26.0] },
  { name: "루손해협",       bbox: [120.0, 20.0, 122.0, 22.0] },
  { name: "대한해협",       bbox: [128.5, 33.8, 130.2, 35.0] },
  { name: "쓰가루",         bbox: [140.3, 41.2, 141.7, 41.7] },
  { name: "라페루즈",       bbox: [141.5, 45.5, 143.0, 46.0] },
  { name: "지브롤터",       bbox: [-5.8, 35.8, -5.2, 36.3] },
  { name: "도버",           bbox: [1.0, 50.7, 1.7, 51.2] },
  { name: "파나마",         bbox: [-80.1, 8.8, -79.3, 9.5] },
  { name: "보스포러스",     bbox: [28.9, 41.0, 29.2, 41.3] },
];

// 경로 좌표(GeoJSON [lng, lat] 배열)에서 통과한 해협 이름을 등장 순서로 반환
function detectStraits(coords: number[][]): string[] {
  const hits: string[] = [];
  const seen = new Set<string>();
  for (const [lng, lat] of coords) {
    for (const s of STRAITS) {
      if (seen.has(s.name)) continue;
      const [minLng, minLat, maxLng, maxLat] = s.bbox;
      if (lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat) {
        seen.add(s.name);
        hits.push(s.name);
      }
    }
  }
  return hits;
}

export interface RouteResult {
  distanceNM: number;
  durationHours: number;
  days: number;
  passages: string[];
  coordinates: [number, number][]; // [lat, lng] for Leaflet
  detourRatio?: number;
  error: string | null;
}

export function calculateRoute(
  fromCode: string,
  toCode: string,
  speedKnots = 14
): RouteResult {
  if (fromCode === toCode) {
    return { distanceNM: 0, durationHours: 0, days: 0, passages: [], coordinates: [], error: null };
  }

  const from = PORTS[fromCode];
  const to = PORTS[toCode];
  if (!from || !to) {
    return { distanceNM: 0, durationHours: 0, days: 0, passages: [], coordinates: [], error: "Unknown port code" };
  }

  try {
    const route = seaRoute(from.coords, to.coords, {
      units: "nauticalmiles",
      speedKnots,
      returnPassages: true,
    });

    const props = route.properties as {
      length: number;
      durationHours: number;
      passages?: string[];
      detourRatio?: number;
    };
    const geom = route.geometry as unknown as { coordinates: number[][] };

    // GeoJSON [lng, lat] -> Leaflet [lat, lng]
    const leafletCoords: [number, number][] = geom.coordinates.map(c => [c[1], c[0]]);

    return {
      distanceNM: Math.round(props.length),
      durationHours: props.durationHours,
      days: props.durationHours / 24,
      passages: detectStraits(geom.coordinates),
      coordinates: leafletCoords,
      detourRatio: props.detourRatio,
      error: null,
    };
  } catch (err) {
    return {
      distanceNM: 0,
      durationHours: 0,
      days: 0,
      passages: [],
      coordinates: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function formatPassage(passage: string): string {
  const map: Record<string, string> = {
    malacca: "말라카",
    suez: "수에즈",
    panama: "파나마",
    gibraltar: "지브롤터",
    dover: "도버",
    babelmandeb: "Bab-el-Mandeb",
    bosphorus: "보스포러스",
    kiel: "킬",
    corinth: "코린토스",
  };
  return map[passage] || passage;
}
