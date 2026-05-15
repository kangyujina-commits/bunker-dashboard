import { seaRoute } from "searoute-ts";
import { PORTS } from "./ports";

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
      passages: props.passages ?? [],
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
