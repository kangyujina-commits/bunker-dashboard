// 전세계 주요 해협 / 운하 / 곶 데이터
// coords: [lat, lng] — Leaflet 입력 형식 (lng,lat 아님 주의)

export interface Strait {
  id: string;
  nameKr: string;        // 한글명
  nameEn: string;        // 영문명
  coords: [number, number]; // [lat, lng]
  type: "strait" | "canal" | "cape" | "passage";
  width: string;          // 최협 폭 또는 길이
  connects: [string, string]; // 양쪽 수역
  importance: string;     // 한 줄 핵심
  description: string;    // 상세 (markdown-lite: **bold** + \n)
  risk?: string;          // 지정학·운항 리스크
  region: "asia" | "middle-east" | "europe" | "americas" | "africa" | "oceania";
}

export const STRAITS: readonly Strait[] = [
  // ─── 중동 ───
  {
    id: "hormuz",
    nameKr: "호르무즈 해협",
    nameEn: "Strait of Hormuz",
    coords: [26.566, 56.250],
    type: "strait",
    width: "최협 33 km",
    connects: ["페르시아만", "오만만 → 인도양"],
    importance: "세계 해상 원유 30%, LNG 20% 통과",
    description:
`**위치**: 이란 ↔ 오만 (무산담 반도) 사이
**양안**: 이란 (북) · 오만 (남)
**최협**: 33 km (운항 가능 폭은 더 좁음)
**통항량**:
   • 일일 원유·콘덴세이트 ~2,000만 bbl
   • LNG 카타르 수출의 100%
   • 한국·중국·일본 원유 수입의 핵심 통로
**대안 경로**: 사우디 동서 파이프라인 (제한적)
**Tip**: "호르무즈 = 페르시아만 입구"로 외우기`,
    risk: "이란-서방 긴장 시 봉쇄 위협 → 유가 즉시 $10+ 상승 트리거",
    region: "middle-east",
  },
  {
    id: "bab-el-mandeb",
    nameKr: "밥엘만데브 해협",
    nameEn: "Bab el-Mandeb",
    coords: [12.583, 43.333],
    type: "strait",
    width: "최협 29 km",
    connects: ["홍해", "아덴만 → 인도양"],
    importance: "수에즈 항로의 남쪽 입구",
    description:
`**위치**: 예멘 ↔ 지부티/에리트레아
**의미**: "눈물의 문" (아랍어)
**통항량**:
   • 일일 ~9.5백만 bbl 원유
   • 아시아-유럽 컨테이너 항로 핵심
**전략 중요성**:
   • 수에즈 운하 통과 선박은 반드시 여기 지남
**Tip**: 수에즈 가려면 → 밥엘만데브 통과 필수`,
    risk: "후티(예멘) 공격 — 2023~2024 컨테이너선 다수 피격, 일부는 희망봉 우회로 변경 (운임·연료비 대폭 증가)",
    region: "middle-east",
  },
  {
    id: "suez",
    nameKr: "수에즈 운하",
    nameEn: "Suez Canal",
    coords: [30.585, 32.345],
    type: "canal",
    width: "길이 193 km · 폭 ~205 m",
    connects: ["지중해", "홍해"],
    importance: "유럽-아시아 최단 항로",
    description:
`**위치**: 이집트 (포트사이드 ↔ 수에즈)
**길이**: 193 km
**개통**: 1869년, 2015년 확장 (Suez Canal Authority)
**통항량**: 세계 무역의 12% (컨테이너 30%)
**통과 시간**: ~12~16시간
**통항료**: VLCC 기준 $400K~$700K (선박 종류·크기 따라)
**대안**: 희망봉 우회 → 아시아-유럽 +10~14일, 연료 +30%
**유명 사건**:
   • 2021 Ever Given 좌초 (6일 봉쇄)`,
    risk: "이집트 정세, 후티 공격으로 인한 우회 (2024)",
    region: "middle-east",
  },

  // ─── 유럽 ───
  {
    id: "gibraltar",
    nameKr: "지브롤터 해협",
    nameEn: "Strait of Gibraltar",
    coords: [35.967, -5.583],
    type: "strait",
    width: "최협 14 km",
    connects: ["대서양", "지중해"],
    importance: "지중해 진입의 유일한 통로",
    description:
`**위치**: 스페인 ↔ 모로코
**최협**: 14 km (런던-파리 직선거리보다 좁음)
**통항량**: 일일 300+ 선박
**해협 깊이**: ~300 m
**유명**: 지브롤터 바위 (영국령)
**조류**: 대서양 → 지중해 표층, 지중해 → 대서양 심층 (염도 차이로 역류)`,
    region: "europe",
  },
  {
    id: "bosphorus",
    nameKr: "보스포루스 해협",
    nameEn: "Bosphorus / Strait of Istanbul",
    coords: [41.114, 29.067],
    type: "strait",
    width: "최협 700 m",
    connects: ["흑해", "마르마라해 → 지중해"],
    importance: "흑해(러시아·우크라이나) 수출 핵심",
    description:
`**위치**: 터키 이스탄불 통과
**최협**: 단 700 m (세계 주요 해협 중 가장 좁음)
**길이**: 31 km
**통항량**:
   • 일일 ~150 선박
   • 러시아·카자흐스탄·우크라이나 곡물·원유 수출 핵심
**규제**: 1936 몽트뢰 조약 — 군함 통항 제한
**연계 해협**: 다르다넬스 (남쪽, 마르마라해 ↔ 에게해)`,
    risk: "러시아-우크라이나 전쟁 시 흑해 항로 차단 → 곡물·해바라기유 가격 폭등",
    region: "europe",
  },
  {
    id: "dardanelles",
    nameKr: "다르다넬스 해협",
    nameEn: "Dardanelles",
    coords: [40.233, 26.408],
    type: "strait",
    width: "최협 1.2 km",
    connects: ["에게해", "마르마라해"],
    importance: "보스포루스와 함께 흑해 진출입 통로",
    description:
`**위치**: 터키 (유럽-아시아 경계)
**최협**: 1.2 km
**길이**: 61 km
**역사**: 갈리폴리 전투 (WWI), 트로이 인근
**연계**: 흑해 → 보스포루스 → 마르마라해 → **다르다넬스** → 에게해 → 지중해
**Tip**: 보스포루스(이스탄불)와 다르다넬스(트로이)는 한 세트`,
    region: "europe",
  },
  {
    id: "english-channel",
    nameKr: "영국 해협 / 도버 해협",
    nameEn: "English Channel / Strait of Dover",
    coords: [50.967, 1.450],
    type: "strait",
    width: "최협 33 km (도버 해협)",
    connects: ["대서양 (북해)", "대서양 본류"],
    importance: "유럽 북부 진출입 + 세계 최혼잡 해협",
    description:
`**위치**: 영국 ↔ 프랑스
**도버 해협 (최협부)**: 33 km
**채널 전체 길이**: 560 km
**통항량**: 세계 최혼잡 (~400 선박/일)
**해저터널**: 채널터널 (1994 개통)
**TSS (분리통항제도)**: 영국행/프랑스행 차선 분리`,
    region: "europe",
  },

  // ─── 아시아 (동남아) ───
  {
    id: "malacca",
    nameKr: "말라카 해협",
    nameEn: "Strait of Malacca",
    coords: [3.000, 100.667],
    type: "strait",
    width: "최협 2.7 km · 길이 930 km",
    connects: ["인도양", "남중국해"],
    importance: "세계 무역 25%, 한국·중국·일본 원유의 80% 통과",
    description:
`**위치**: 말레이반도 ↔ 수마트라 (인도네시아)
**최협**: 2.7 km (필립스 채널)
**길이**: 930 km
**통항량**:
   • 일일 200+ 선박, 연 9만 척
   • 호르무즈 다음으로 중요한 원유 경로
   • Singapore 봉커링 = 말라카 통과 선박 대상
**Tip**: 한국발 중동행 = 말라카 통과 필수
**대안 경로**: 순다, 롬복 (더 길고 비쌈)`,
    risk: "해적 (Eyl, 인도네시아 측), 좁은 폭으로 좌초 위험",
    region: "asia",
  },
  {
    id: "sunda",
    nameKr: "순다 해협",
    nameEn: "Sunda Strait",
    coords: [-6.000, 105.800],
    type: "strait",
    width: "최협 24 km",
    connects: ["인도양", "자바해 → 남중국해"],
    importance: "말라카 대안 (남쪽 우회 시 첫 옵션)",
    description:
`**위치**: 인도네시아 (자바 ↔ 수마트라)
**최협**: 24 km
**의미**: 말라카가 막히면 가장 가까운 대안
**유명**: 크라카타우 화산 (인근, 1883 대분화)
**제한**: 깊이 얕음 — 대형 탱커는 통과 어려움`,
    region: "asia",
  },
  {
    id: "lombok",
    nameKr: "롬복 해협",
    nameEn: "Lombok Strait",
    coords: [-8.667, 115.800],
    type: "strait",
    width: "최협 18 km · 깊이 250m+",
    connects: ["인도양", "자바해"],
    importance: "VLCC·ULCC가 말라카 대신 쓰는 깊은 대안",
    description:
`**위치**: 인도네시아 (발리 ↔ 롬복)
**최협**: 18 km
**깊이**: 250+ m → 흘수(draft) 제한 큰 선박도 통과 가능
**VLCC 통항**:
   • 호주 → 동아시아 LNG·원유
   • 말라카 우회 시 +1,000 NM
**Wallace's Line**: 생물지리학 경계선 (롬복-발리)`,
    region: "asia",
  },

  // ─── 아시아 (동북아) ───
  {
    id: "taiwan",
    nameKr: "대만 해협",
    nameEn: "Strait of Taiwan / Formosa",
    coords: [24.500, 119.500],
    type: "strait",
    width: "최협 130 km · 길이 400 km",
    connects: ["동중국해", "남중국해"],
    importance: "동아시아-동남아 항로 + 지정학 핵심",
    description:
`**위치**: 중국 ↔ 대만
**폭**: 130 km (최협) ~ 220 km
**중간선 (Median Line)**: 사실상 양안 군사 경계
**통항량**:
   • 일일 ~50% 글로벌 컨테이너 선박 통과
   • 한국·일본 ↔ 동남아 항로
**Tip**: 부산-Singapore 갈 때 대만 해협 또는 동쪽 우회`,
    risk: "중국-대만 군사 긴장 시 우회 가능성 → 운항·보험료 영향",
    region: "asia",
  },
  {
    id: "korea-strait",
    nameKr: "대한 해협",
    nameEn: "Korea Strait",
    coords: [34.500, 129.000],
    type: "strait",
    width: "최협 200 km",
    connects: ["동해 (일본해)", "동중국해"],
    importance: "한국 ↔ 일본, 동해 진출입 통로",
    description:
`**위치**: 한국 (부산) ↔ 일본 (큐슈)
**폭**: 200 km
**구성**:
   • 서수도 (한국 쪽, 서쪽 쓰시마 지나)
   • 동수도 (일본 쪽, 동쪽 쓰시마 지나)
**중간**: 쓰시마섬 (일본령)
**한국 영해**: 부산-쓰시마 사이 절반`,
    region: "asia",
  },
  {
    id: "tsushima",
    nameKr: "쓰시마 해협",
    nameEn: "Tsushima Strait",
    coords: [34.083, 129.500],
    type: "strait",
    width: "최협 50 km",
    connects: ["대한해협 (남)", "동해 (북)"],
    importance: "동해 진입의 일본 측 통로",
    description:
`**위치**: 일본 쓰시마섬 ↔ 큐슈/혼슈
**의미**: 대한해협의 동쪽 절반 (좁은 의미로는 별개)
**역사**: 러일전쟁 (1905 쓰시마 해전) 무대
**Tip**: 한국에선 통상 "대한해협"으로 통칭`,
    region: "asia",
  },
  {
    id: "tsugaru",
    nameKr: "쓰가루 해협",
    nameEn: "Tsugaru Strait",
    coords: [41.500, 140.500],
    type: "strait",
    width: "최협 19 km",
    connects: ["동해", "북태평양"],
    importance: "동해 → 북태평양 출구 (혼슈 ↔ 홋카이도)",
    description:
`**위치**: 일본 혼슈 ↔ 홋카이도
**최협**: 19 km
**해저터널**: 세이칸 터널 (1988 개통, 53.85 km 세계 최장)
**제한**: 일본 영해지만 국제해협으로 자유 통항 허용
**용도**: 러시아 극동·동해 출입선이 사용`,
    region: "asia",
  },
  {
    id: "soya",
    nameKr: "소야 해협 / 라페루즈 해협",
    nameEn: "Sōya Strait / La Pérouse Strait",
    coords: [45.717, 141.917],
    type: "strait",
    width: "최협 42 km",
    connects: ["동해", "오호츠크해"],
    importance: "러시아 사할린 ↔ 일본 홋카이도",
    description:
`**위치**: 일본 홋카이도 (소야곶) ↔ 러시아 사할린
**최협**: 42 km
**일본명**: 소야 (宗谷)
**프랑스 탐험가명**: 라페루즈 백작 (Lapérouse, 1787)
**용도**: 러시아 태평양 함대 출구 중 하나
**겨울**: 유빙 위험`,
    region: "asia",
  },

  // ─── 아메리카 ───
  {
    id: "panama",
    nameKr: "파나마 운하",
    nameEn: "Panama Canal",
    coords: [9.080, -79.680],
    type: "canal",
    width: "길이 82 km · 갑문식",
    connects: ["대서양 (카리브해)", "태평양"],
    importance: "남미 우회 없이 두 대양 연결",
    description:
`**위치**: 파나마
**길이**: 82 km
**개통**: 1914년 (미국) → 2016년 확장 (Neopanamax 등급)
**갑문식 (Lock system)**:
   • 3단계 갑문으로 수위 26m 상승/하강
   • 가툰 호수 통과
**선박 크기 한계**:
   • Panamax: 길이 294 m, 폭 32 m, 흘수 12 m
   • Neopanamax (2016~): 길이 366 m, 폭 49 m, 흘수 15.2 m
**통과료**: VLCC $400K~, ULCS $1M+
**대안**: 마젤란 해협 / 혼곶 (남미 끝)
**최근 이슈**: 가뭄으로 가툰호 수위 저하 → 통항 제한 (2023~)`,
    risk: "기후변화 가뭄 → 통항 수 감소, 운임 상승",
    region: "americas",
  },
  {
    id: "magellan",
    nameKr: "마젤란 해협",
    nameEn: "Strait of Magellan",
    coords: [-53.500, -71.000],
    type: "strait",
    width: "길이 570 km · 최협 3 km",
    connects: ["대서양", "태평양"],
    importance: "파나마 운하 대안 (남미 남단)",
    description:
`**위치**: 아르헨티나/칠레 사이 (티에라델푸에고섬 북쪽)
**길이**: 570 km
**최협**: 3 km
**역사**: 마젤란 1520년 발견
**현대 용도**: 파나마 운하 불가 시 (초대형선)
**대안**: 혼곶 (더 남쪽, 더 위험)
**Tip**: 마젤란 < 드레이크 < 혼곶 순으로 남쪽 (위도 차이)`,
    region: "americas",
  },
  {
    id: "drake",
    nameKr: "드레이크 통과",
    nameEn: "Drake Passage",
    coords: [-58.500, -65.000],
    type: "passage",
    width: "폭 800 km",
    connects: ["대서양", "태평양"],
    importance: "남극 최단 항로 · 세계에서 가장 험한 바다",
    description:
`**위치**: 남미 혼곶 ↔ 남극 반도
**폭**: 약 800 km
**특징**:
   • 강한 서풍대 (Furious Fifties, Screaming Sixties)
   • 파고 20m+ 자주 발생
   • 남극 순환류 유일 통과 지점
**상업 통항**: 거의 없음 (위험)
**용도**: 남극 관광·과학 탐사선`,
    region: "americas",
  },
  {
    id: "cape-horn",
    nameKr: "혼곶 (케이프 혼)",
    nameEn: "Cape Horn",
    coords: [-55.983, -67.267],
    type: "cape",
    width: "—",
    connects: ["대서양", "태평양"],
    importance: "남미 최남단 — 전통 항로 (파나마 전)",
    description:
`**위치**: 칠레 (티에라델푸에고 남단)
**의미**: 남극 가까운 곶, 'Cape Horner'는 이를 돌아본 선원
**역사**:
   • 19세기 이전 양 대양 연결 유일 경로
   • 1914 파나마 운하 개통 후 상업 항해 격감
**기후**: 강풍, 큰 파도, 빙산
**현대 용도**: 요트 레이스 (Vendée Globe 등)`,
    region: "americas",
  },

  // ─── 아프리카 / 인도양 ───
  {
    id: "cape-of-good-hope",
    nameKr: "희망봉 (케이프오브굿호프)",
    nameEn: "Cape of Good Hope",
    coords: [-34.357, 18.474],
    type: "cape",
    width: "—",
    connects: ["대서양", "인도양"],
    importance: "수에즈 막힐 때 유럽-아시아 우회 경로",
    description:
`**위치**: 남아공 (케이프타운 인근)
**의미**: 1488 디아스 발견, 인도양 진입 첫 곶
**현대 용도**:
   • 수에즈 운하 봉쇄·후티 공격 시 우회 경로
   • 부산-Rotterdam 우회 시 +10~14일, +30~40% 연료
**남단 정확한 위치**: 사실은 케이프 아굴라스 (50km 동쪽)지만 통상 희망봉으로 통칭
**대형선**: 흘수 제한 없음 → ULCC도 통과`,
    region: "africa",
  },

  // ─── 기타 ───
  {
    id: "bering",
    nameKr: "베링 해협",
    nameEn: "Bering Strait",
    coords: [65.667, -169.000],
    type: "strait",
    width: "최협 82 km",
    connects: ["북극해", "북태평양"],
    importance: "북극항로 (NSR) 진출입",
    description:
`**위치**: 알래스카 ↔ 러시아 추코트카
**최협**: 82 km
**의미**:
   • 빙기 시대 베링지아 (육교) → 인류 아메리카 이주 경로
   • 현재 북극항로(NSR) 동측 출구
**상업 통항**:
   • 여름철 6~10월만 가능 (얼음 녹는 시기)
   • 러시아 NSR 통과료 + 쇄빙선 비용
**미래**: 기후변화로 통항 가능 일수 증가`,
    risk: "겨울 얼음, 러시아 NSR 통제, 미-러 긴장",
    region: "asia",
  },
  {
    id: "kerch",
    nameKr: "케르치 해협",
    nameEn: "Kerch Strait",
    coords: [45.300, 36.530],
    type: "strait",
    width: "최협 4.5 km",
    connects: ["흑해", "아조프해"],
    importance: "러시아 ↔ 크림반도",
    description:
`**위치**: 크림반도 ↔ 러시아 본토
**최협**: 4.5 km
**다리**: 케르치 다리 (2018 개통) — 우크라이나 분쟁 핵심
**전략 의미**: 우크라이나 마리우폴·베르단스크 항만 접근
**2014 이후**: 러시아 사실상 통제`,
    region: "europe",
  },
];

// 카테고리(지역) 메타
export const REGION_META: Record<Strait["region"], { label: string; color: string }> = {
  "middle-east": { label: "중동", color: "#f59e0b" },
  "europe":      { label: "유럽", color: "#38bdf8" },
  "asia":        { label: "아시아", color: "#a3e635" },
  "americas":    { label: "아메리카", color: "#c084fc" },
  "africa":      { label: "아프리카", color: "#fb7185" },
  "oceania":     { label: "오세아니아", color: "#22d3ee" },
};

export const TYPE_META: Record<Strait["type"], { label: string; icon: string }> = {
  strait:  { label: "해협",   icon: "🌊" },
  canal:   { label: "운하",   icon: "🛶" },
  cape:    { label: "곶",     icon: "🏔️" },
  passage: { label: "통과해", icon: "⛴️" },
};
