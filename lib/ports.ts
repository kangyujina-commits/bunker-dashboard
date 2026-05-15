// 주요 항구 좌표 — searoute-ts 입력 형식 [lng, lat]
// 80+ 글로벌 컨테이너·벙커링 허브. 새 항구 추가 시 여기에만 한 줄.

export interface PortInfo {
  name: string;     // 표시용 짧은 이름
  full: string;     // 풀 네임 (도시, 국가)
  coords: [number, number]; // [lng, lat]
  region: "ne-asia" | "se-asia" | "south-asia" | "middle-east" | "europe" | "africa" | "americas" | "oceania";
}

export const PORTS: Record<string, PortInfo> = {
  // ── 동북아시아 ──
  BUS: { name: "Busan",         full: "Busan, Korea",           coords: [129.075, 35.103], region: "ne-asia" },
  USN: { name: "Ulsan",         full: "Ulsan, Korea",           coords: [129.391, 35.510], region: "ne-asia" },
  YOS: { name: "Yeosu",         full: "Yeosu, Korea",           coords: [127.760, 34.760], region: "ne-asia" },
  KAN: { name: "Gwangyang",     full: "Gwangyang, Korea",       coords: [127.752, 34.901], region: "ne-asia" },
  INC: { name: "Incheon",       full: "Incheon, Korea",         coords: [126.605, 37.451], region: "ne-asia" },
  TYO: { name: "Tokyo",         full: "Tokyo, Japan",           coords: [139.770, 35.620], region: "ne-asia" },
  YOK: { name: "Yokohama",      full: "Yokohama, Japan",        coords: [139.660, 35.450], region: "ne-asia" },
  UKB: { name: "Kobe",          full: "Kobe, Japan",            coords: [135.196, 34.683], region: "ne-asia" },
  OSA: { name: "Osaka",         full: "Osaka, Japan",           coords: [135.420, 34.650], region: "ne-asia" },
  NGO: { name: "Nagoya",        full: "Nagoya, Japan",          coords: [136.875, 35.075], region: "ne-asia" },
  SHA: { name: "Shanghai",      full: "Shanghai, China",        coords: [121.880, 31.270], region: "ne-asia" },
  NGB: { name: "Ningbo",        full: "Ningbo-Zhoushan, China", coords: [122.000, 29.875], region: "ne-asia" },
  TAO: { name: "Qingdao",       full: "Qingdao, China",         coords: [120.180, 36.075], region: "ne-asia" },
  TSN: { name: "Tianjin",       full: "Tianjin, China",         coords: [117.700, 38.985], region: "ne-asia" },
  DLC: { name: "Dalian",        full: "Dalian, China",          coords: [121.660, 38.920], region: "ne-asia" },
  SZX: { name: "Shenzhen",      full: "Shenzhen, China",        coords: [114.255, 22.610], region: "ne-asia" },
  CAN: { name: "Guangzhou",     full: "Guangzhou, China",       coords: [113.450, 23.075], region: "ne-asia" },
  HKG: { name: "Hong Kong",     full: "Hong Kong",              coords: [114.158, 22.279], region: "ne-asia" },
  KHH: { name: "Kaohsiung",     full: "Kaohsiung, Taiwan",      coords: [120.281, 22.620], region: "ne-asia" },
  TPE: { name: "Keelung",       full: "Keelung (Taipei), Taiwan", coords: [121.745, 25.130], region: "ne-asia" },

  // ── 동남아시아 ──
  SIN: { name: "Singapore",     full: "Singapore",              coords: [103.851, 1.290],  region: "se-asia" },
  PKG: { name: "Port Klang",    full: "Port Klang, Malaysia",   coords: [101.395, 3.000],  region: "se-asia" },
  TPP: { name: "Tg. Pelepas",   full: "Tanjung Pelepas, Malaysia", coords: [103.553, 1.366], region: "se-asia" },
  MNL: { name: "Manila",        full: "Manila, Philippines",    coords: [120.973, 14.585], region: "se-asia" },
  CEB: { name: "Cebu",          full: "Cebu, Philippines",      coords: [123.910, 10.305], region: "se-asia" },
  HCM: { name: "Ho Chi Minh",   full: "Ho Chi Minh, Vietnam",   coords: [106.788, 10.769], region: "se-asia" },
  HPH: { name: "Hai Phong",     full: "Hai Phong, Vietnam",     coords: [106.700, 20.866], region: "se-asia" },
  LCH: { name: "Laem Chabang",  full: "Laem Chabang, Thailand", coords: [100.882, 13.087], region: "se-asia" },
  BKK: { name: "Bangkok",       full: "Bangkok, Thailand",      coords: [100.580, 13.700], region: "se-asia" },
  JKT: { name: "Jakarta",       full: "Tanjung Priok, Indonesia", coords: [106.880, -6.105], region: "se-asia" },
  SUB: { name: "Surabaya",      full: "Tanjung Perak (Surabaya), Indonesia", coords: [112.730, -7.205], region: "se-asia" },

  // ── 남아시아 ──
  BOM: { name: "Mumbai",        full: "Nhava Sheva (Mumbai), India", coords: [72.940, 18.945], region: "south-asia" },
  MAA: { name: "Chennai",       full: "Chennai, India",         coords: [80.290, 13.100],  region: "south-asia" },
  MUN: { name: "Mundra",        full: "Mundra, India",          coords: [69.703, 22.840],  region: "south-asia" },
  CCU: { name: "Kolkata",       full: "Kolkata, India",         coords: [88.330, 22.550],  region: "south-asia" },
  KHI: { name: "Karachi",       full: "Karachi, Pakistan",      coords: [66.965, 24.815],  region: "south-asia" },
  CGP: { name: "Chittagong",    full: "Chittagong, Bangladesh", coords: [91.815, 22.310],  region: "south-asia" },
  CMB: { name: "Colombo",       full: "Colombo, Sri Lanka",     coords: [79.857, 6.951],   region: "south-asia" },

  // ── 중동 ──
  FJR: { name: "Fujairah",      full: "Fujairah, UAE",          coords: [56.349, 25.117],  region: "middle-east" },
  DXB: { name: "Jebel Ali",     full: "Jebel Ali (Dubai), UAE", coords: [55.060, 25.020],  region: "middle-east" },
  AUH: { name: "Abu Dhabi",     full: "Khalifa (Abu Dhabi), UAE", coords: [54.620, 24.840], region: "middle-east" },
  DOH: { name: "Hamad",         full: "Hamad (Doha), Qatar",    coords: [51.604, 25.014],  region: "middle-east" },
  BAH: { name: "Bahrain",       full: "Khalifa bin Salman, Bahrain", coords: [50.660, 26.230], region: "middle-east" },
  KWI: { name: "Kuwait",        full: "Shuwaikh (Kuwait City), Kuwait", coords: [47.940, 29.355], region: "middle-east" },
  SLL: { name: "Salalah",       full: "Salalah, Oman",          coords: [54.005, 16.945],  region: "middle-east" },
  BND: { name: "Bandar Abbas",  full: "Bandar Abbas, Iran",     coords: [56.190, 27.155],  region: "middle-east" },
  JED: { name: "Jeddah",        full: "Jeddah, Saudi Arabia",   coords: [39.165, 21.490],  region: "middle-east" },
  DAM: { name: "Dammam",        full: "Dammam, Saudi Arabia",   coords: [50.110, 26.510],  region: "middle-east" },
  YNB: { name: "Yanbu",         full: "Yanbu, Saudi Arabia",    coords: [38.018, 24.090],  region: "middle-east" },
  AQJ: { name: "Aqaba",         full: "Aqaba, Jordan",          coords: [35.000, 29.522],  region: "middle-east" },
  ADE: { name: "Aden",          full: "Aden, Yemen",            coords: [44.985, 12.793],  region: "middle-east" },
  JIB: { name: "Djibouti",      full: "Djibouti",               coords: [43.155, 11.595],  region: "middle-east" },

  // ── 유럽 ──
  RTM: { name: "Rotterdam",     full: "Rotterdam, Netherlands", coords: [4.131, 51.949],   region: "europe" },
  ANR: { name: "Antwerp",       full: "Antwerp, Belgium",       coords: [4.395, 51.286],   region: "europe" },
  HAM: { name: "Hamburg",       full: "Hamburg, Germany",       coords: [9.965, 53.540],   region: "europe" },
  BRV: { name: "Bremerhaven",   full: "Bremerhaven, Germany",   coords: [8.560, 53.560],   region: "europe" },
  LEH: { name: "Le Havre",      full: "Le Havre, France",       coords: [0.105, 49.485],   region: "europe" },
  MRS: { name: "Marseille",     full: "Marseille / Fos, France", coords: [4.860, 43.290],   region: "europe" },
  FXT: { name: "Felixstowe",    full: "Felixstowe, UK",         coords: [1.310, 51.955],   region: "europe" },
  SOU: { name: "Southampton",   full: "Southampton, UK",        coords: [-1.405, 50.895],  region: "europe" },
  LGP: { name: "London Gateway",full: "London Gateway, UK",     coords: [0.470, 51.500],   region: "europe" },
  ALG: { name: "Algeciras",     full: "Algeciras, Spain",       coords: [-5.430, 36.130],  region: "europe" },
  BCN: { name: "Barcelona",     full: "Barcelona, Spain",       coords: [2.190, 41.350],   region: "europe" },
  VLC: { name: "Valencia",      full: "Valencia, Spain",        coords: [-0.310, 39.450],  region: "europe" },
  GOA: { name: "Genoa",         full: "Genoa, Italy",           coords: [8.927, 44.402],   region: "europe" },
  GIT: { name: "Gioia Tauro",   full: "Gioia Tauro, Italy",     coords: [15.910, 38.450],  region: "europe" },
  NAP: { name: "Naples",        full: "Naples, Italy",          coords: [14.265, 40.842],  region: "europe" },
  PIR: { name: "Piraeus",       full: "Piraeus (Athens), Greece", coords: [23.625, 37.940], region: "europe" },
  IST: { name: "Istanbul",      full: "Ambarli (Istanbul), Turkey", coords: [28.685, 40.965], region: "europe" },
  CND: { name: "Constanta",     full: "Constanta, Romania",     coords: [28.660, 44.180],  region: "europe" },
  LPA: { name: "Las Palmas",    full: "Las Palmas, Spain",      coords: [-15.412, 28.140], region: "europe" },
  LIS: { name: "Lisbon",        full: "Lisbon, Portugal",       coords: [-9.135, 38.700],  region: "europe" },
  GIB: { name: "Gibraltar",     full: "Gibraltar",              coords: [-5.353, 36.140],  region: "europe" },

  // ── 아프리카 ──
  CPT: { name: "Cape Town",     full: "Cape Town, S. Africa",   coords: [18.424, -33.918], region: "africa" },
  DUR: { name: "Durban",        full: "Durban, S. Africa",      coords: [31.040, -29.870], region: "africa" },
  MBA: { name: "Mombasa",       full: "Mombasa, Kenya",         coords: [39.660, -4.060],  region: "africa" },
  DAR: { name: "Dar es Salaam", full: "Dar es Salaam, Tanzania", coords: [39.300, -6.815], region: "africa" },
  LOS: { name: "Lagos",         full: "Lagos (Apapa), Nigeria", coords: [3.380, 6.450],    region: "africa" },
  TMA: { name: "Tema",          full: "Tema, Ghana",            coords: [0.005, 5.640],    region: "africa" },
  ABJ: { name: "Abidjan",       full: "Abidjan, Côte d'Ivoire", coords: [-4.018, 5.275],   region: "africa" },
  CAS: { name: "Casablanca",    full: "Casablanca, Morocco",    coords: [-7.617, 33.610],  region: "africa" },
  PSD: { name: "Port Said",     full: "Port Said, Egypt",       coords: [32.305, 31.265],  region: "africa" },
  SUZ: { name: "Suez",          full: "Suez, Egypt",            coords: [32.548, 29.967],  region: "africa" },

  // ── 아메리카 ──
  LAX: { name: "LA/LB",         full: "Los Angeles / Long Beach, USA", coords: [-118.265, 33.738], region: "americas" },
  OAK: { name: "Oakland",       full: "Oakland, USA",           coords: [-122.310, 37.795], region: "americas" },
  SEA: { name: "Seattle",       full: "Seattle / Tacoma, USA",  coords: [-122.340, 47.605], region: "americas" },
  NYC: { name: "NY/NJ",         full: "New York / New Jersey, USA", coords: [-74.075, 40.690], region: "americas" },
  ORF: { name: "Norfolk",       full: "Norfolk, USA",           coords: [-76.295, 36.870],  region: "americas" },
  SAV: { name: "Savannah",      full: "Savannah, USA",          coords: [-80.910, 32.085],  region: "americas" },
  HOU: { name: "Houston",       full: "Houston, USA",           coords: [-95.180, 29.605],  region: "americas" },
  MSY: { name: "New Orleans",   full: "New Orleans, USA",       coords: [-90.075, 29.945],  region: "americas" },
  YVR: { name: "Vancouver",     full: "Vancouver, Canada",      coords: [-123.105, 49.290], region: "americas" },
  HFX: { name: "Halifax",       full: "Halifax, Canada",        coords: [-63.575, 44.640],  region: "americas" },
  YMQ: { name: "Montreal",      full: "Montreal, Canada",       coords: [-73.555, 45.555],  region: "americas" },
  BLB: { name: "Balboa",        full: "Balboa (Panama, Pacific)", coords: [-79.560, 8.960], region: "americas" },
  CRI: { name: "Cristobal",     full: "Cristobal (Panama, Atlantic)", coords: [-79.920, 9.355], region: "americas" },
  SSZ: { name: "Santos",        full: "Santos, Brazil",         coords: [-46.330, -23.965], region: "americas" },
  BUE: { name: "Buenos Aires",  full: "Buenos Aires, Argentina", coords: [-58.370, -34.580], region: "americas" },
  VAP: { name: "Valparaiso",    full: "Valparaiso, Chile",      coords: [-71.620, -33.040], region: "americas" },
  CLL: { name: "Callao",        full: "Callao (Lima), Peru",    coords: [-77.155, -12.060], region: "americas" },
  CTG: { name: "Cartagena",     full: "Cartagena, Colombia",    coords: [-75.530, 10.395],  region: "americas" },

  // ── 오세아니아 ──
  SYD: { name: "Sydney",        full: "Sydney, Australia",      coords: [151.205, -33.870], region: "oceania" },
  MEL: { name: "Melbourne",     full: "Melbourne, Australia",   coords: [144.910, -37.840], region: "oceania" },
  BNE: { name: "Brisbane",      full: "Brisbane, Australia",    coords: [153.180, -27.385], region: "oceania" },
  PER: { name: "Fremantle",     full: "Fremantle (Perth), Australia", coords: [115.745, -32.060], region: "oceania" },
  AKL: { name: "Auckland",      full: "Auckland, New Zealand",  coords: [174.770, -36.840], region: "oceania" },
};

export const PRESET_ROUTES: { from: string; to: string; label: string }[] = [
  { from: "BUS", to: "SIN", label: "Busan ↔ Singapore" },
  { from: "BUS", to: "LAX", label: "Busan ↔ LA/LB" },
  { from: "BUS", to: "RTM", label: "Busan ↔ Rotterdam" },
  { from: "SIN", to: "RTM", label: "Singapore ↔ Rotterdam" },
  { from: "FJR", to: "SIN", label: "Fujairah ↔ Singapore" },
  { from: "SHA", to: "LAX", label: "Shanghai ↔ LA/LB" },
];

export const DEFAULT_SPEED_KNOTS = 14;

// 지역 라벨 (UI용)
export const REGION_LABELS: Record<PortInfo["region"], string> = {
  "ne-asia":     "동북아",
  "se-asia":     "동남아",
  "south-asia":  "남아시아",
  "middle-east": "중동",
  "europe":      "유럽",
  "africa":      "아프리카",
  "americas":    "아메리카",
  "oceania":     "오세아니아",
};
