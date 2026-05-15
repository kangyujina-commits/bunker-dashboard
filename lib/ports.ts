// 주요 항구 좌표 (lng, lat) — searoute-ts 입력 형식
// 새 항구 추가 시 여기에만 한 줄 추가하면 됩니다.

export interface PortInfo {
  name: string;
  full: string;
  coords: [number, number]; // [lng, lat]
}

export const PORTS: Record<string, PortInfo> = {
  FJR: { name: "Fujairah",     full: "Fujairah, UAE",          coords: [56.349, 25.117] },
  SIN: { name: "Singapore",    full: "Singapore",              coords: [103.851, 1.290] },
  BUS: { name: "Busan",        full: "Busan, Korea",           coords: [129.075, 35.103] },
  HKG: { name: "Hong Kong",    full: "Hong Kong",              coords: [114.158, 22.279] },
  RTM: { name: "Rotterdam",    full: "Rotterdam, Netherlands", coords: [4.131, 51.949] },
  LAX: { name: "LA/LB",        full: "Los Angeles/Long Beach", coords: [-118.265, 33.738] },
  CPT: { name: "Cape Town",    full: "Cape Town, S. Africa",   coords: [18.424, -33.918] },
  CMB: { name: "Colombo",      full: "Colombo, Sri Lanka",     coords: [79.857, 6.951] },
  SUZ: { name: "Suez",         full: "Suez, Egypt",            coords: [32.548, 29.967] },
};

export const PRESET_ROUTES: { from: string; to: string; label: string }[] = [
  { from: "FJR", to: "SIN", label: "Fujairah ↔ Singapore" },
  { from: "SIN", to: "BUS", label: "Singapore ↔ Busan" },
  { from: "FJR", to: "BUS", label: "Fujairah ↔ Busan" },
];

export const DEFAULT_SPEED_KNOTS = 14;
