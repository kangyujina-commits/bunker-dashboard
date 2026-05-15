// 벙커 / 해운 / 원유 시장 상식 데이터
// body: 줄바꿈은 \n으로, 굵게는 **로 감싸기 (간단 마크다운). 카드에서 파싱해 렌더.

export type KnowledgeCategory =
  | "fuel-grades"
  | "unit-conversion"
  | "trade-terms"
  | "market-structure"
  | "regulations"
  | "ship-ops"
  | "indicators"
  | "korea"
  | "alt-fuels"
  | "calculators";

export interface CategoryMeta {
  id: KnowledgeCategory;
  emoji: string;
  label: string;
  color: string;
}

export const CATEGORIES: readonly CategoryMeta[] = [
  { id: "fuel-grades",      emoji: "🛢️", label: "연료 등급",  color: "#f97316" },
  { id: "unit-conversion",  emoji: "📐", label: "단위 환산",  color: "#facc15" },
  { id: "trade-terms",      emoji: "📊", label: "거래 용어",  color: "#38bdf8" },
  { id: "market-structure", emoji: "🏛️", label: "시장 구조",  color: "#a3e635" },
  { id: "regulations",      emoji: "🌱", label: "규제·환경",  color: "#22d3ee" },
  { id: "ship-ops",         emoji: "⚙️", label: "선박 운영",  color: "#c084fc" },
  { id: "indicators",       emoji: "📈", label: "시장 지표",  color: "#fb7185" },
  { id: "korea",            emoji: "🇰🇷", label: "한국 시장", color: "#ef4444" },
  { id: "alt-fuels",        emoji: "🔋", label: "대체 연료",  color: "#10b981" },
  { id: "calculators",      emoji: "🧮", label: "빠른 계산",  color: "#94a3b8" },
] as const;

export interface KnowledgeEntry {
  id: string;
  category: KnowledgeCategory;
  title: string;
  short?: string;
  body: string;
  tags?: string[];
}

export const KNOWLEDGE: readonly KnowledgeEntry[] = [
  // ─────── 1. 연료 등급 & 규격 ───────
  {
    id: "vlsfo", category: "fuel-grades", title: "VLSFO (Very Low Sulfur Fuel Oil)",
    short: "황 함량 0.5% 이하 · IMO 2020 이후 표준 선박 연료",
    body:
`**황 함량**: 0.5% 이하 (mass)
**용도**: IMO 2020 시행 후 글로벌 표준 선박 연료
**가격**: IFO380 대비 $80~$150/MT 프리미엄
**점도**: 보통 380 cSt @ 50°C 이하 (지역별 spec 다름)
**주의**: 블렌드 연료라 cat fines (촉매 미세입자)·호환성 (compatibility) 이슈
**대상 선박**: 스크러버 미장착 외항선 거의 전부`,
    tags: ["fuel", "vlsfo", "imo2020"],
  },
  {
    id: "ifo380", category: "fuel-grades", title: "IFO 380 (Heavy Sulfur Fuel Oil)",
    short: "황 3.5% · HSFO · 스크러버 장착선 전용",
    body:
`**황 함량**: 최대 3.5% (mass)
**점도**: 380 cSt @ 50°C
**용도**: 스크러버(SOx 정화장치) 장착 선박만 사용 가능
**가격**: 가장 저렴 (VLSFO 대비 $100+ 할인)
**주요 사용**: VLCC, Capesize bulk carrier, 대형 컨테이너선 일부
**경제성**: 스크러버 ROI = (VLSFO−HSFO 스프레드 × 연 소비량) ÷ 스크러버 설치비
   → Hi-5 스프레드 $200+ 일 때 2~3년 안에 회수`,
    tags: ["fuel", "ifo", "hsfo", "scrubber"],
  },
  {
    id: "lsmgo", category: "fuel-grades", title: "LSMGO (Low Sulfur Marine Gas Oil)",
    short: "황 0.1% · ECA 구역 의무 · 가장 비싼 마린 연료",
    body:
`**황 함량**: 0.1% 이하
**용도**: ECA/SECA 구역 의무 사용. 항만 대기 시 보조엔진용
**가격**: VLSFO 대비 $150~$300/MT 더 비쌈
**특성**: 디젤유에 가까움 (저점도, 저비중), 안정성 좋음
**약자 혼동 주의**: MGO (일반) vs LSMGO (저황) vs ULSMGO (극저황 0.001%)
**한국**: ECA 아니지만 일부 항만 정박 시 자율적 사용`,
    tags: ["fuel", "lsmgo", "mgo", "eca"],
  },
  {
    id: "imo2020", category: "fuel-grades", title: "IMO 2020 — 0.5% Sulfur Cap",
    short: "2020년 1월 1일 시행. 글로벌 황 한도 3.5% → 0.5%",
    body:
`**시행**: 2020년 1월 1일 (IMO MARPOL Annex VI)
**규제**: 모든 외항선 사용 연료의 황 함량 ≤ 0.5%
**대응 옵션 3가지**:
   • VLSFO (저황유) 사용 — 가장 보편적
   • 스크러버 (SOx scrubber) 장착 → HSFO 계속 사용 가능
   • LNG / 메탄올 등 대체연료 전환
**영향**: VLSFO 가격이 IFO380 보다 통상 $100+ 비싼 게 IMO 2020 직접 결과
**예외**: ECA 내부는 더 엄격 (0.1%)`,
    tags: ["imo", "regulation", "sulfur"],
  },
  {
    id: "eca", category: "fuel-grades", title: "ECA / SECA (Emission Control Area)",
    short: "Sulfur Emission Control Area · 0.1% 황 의무",
    body:
`**ECA 정의**: SOx 배출 통제 구역
**현재 ECA**:
   • 북미 연안 (미국·캐나다 200해리)
   • 발트해
   • 북해
   • US Caribbean (Puerto Rico, US Virgin Is.)
**의무**: 구역 내에서 황 0.1% 이하 연료 사용 (LSMGO 또는 ULSFO)
**향후 추가 예정**: 지중해 (2025), 노르웨이 해역
**한국**: 현재 ECA 아님 (논의 중)
**Tip**: ECA 진입 전 연료 전환 (changeover) 필요 — 항해 계획에 반영`,
    tags: ["eca", "seca", "regulation"],
  },
  {
    id: "biofuel", category: "fuel-grades", title: "B24 / B30 바이오 블렌드",
    short: "VLSFO + 바이오 연료 (FAME/HVO) 24% 또는 30% 혼합",
    body:
`**B24**: 24% 바이오 혼합 — Singapore 표준 (MPA 인증)
**B30**: 30% 바이오 혼합 — 일부 유럽 항만
**구성**: VLSFO + FAME(지방산 메틸에스테르) 또는 HVO(수첨식물성유)
**탄소 감축**: 약 24~30% 라이프사이클 CO₂ 감축
**용도**: EU ETS 인증 면제 적용에 활용
**가격 프리미엄**: VLSFO 대비 +$50~$150/MT
**주의**: FAME 호환성 (시간 지나면 분리 가능) — 즉시 사용 권장`,
    tags: ["biofuel", "b24", "b30", "etse"],
  },
  {
    id: "catfines", category: "fuel-grades", title: "Cat Fines (촉매 미세입자) 주의",
    short: "VLSFO에 포함된 Al+Si 입자 — 엔진 마모 유발",
    body:
`**Cat fines란**: 정제 과정에서 사용된 촉매 (Aluminum + Silicon) 잔류 입자
**영향**: 연료 펌프, 인젝터 노즐, 실린더 라이너 마모
**ISO 8217 한도**:
   • 2017 ed: 60 ppm
   • 2024 ed: 30 ppm (강화)
**대응**:
   • 선상 분리기 (purifier) 2단 운전
   • 정착 (settling) 시간 충분히 확보
   • 인도 시 샘플 채취 + Lab 분석 (대표 sample)
**증상**: 엔진 마모 가속, 출력 저하, 윤활유 오염`,
    tags: ["catfines", "engine", "quality"],
  },
  {
    id: "compatibility", category: "fuel-grades", title: "호환성 (Compatibility) 테스트",
    short: "VLSFO는 블렌드라 다른 배치 섞으면 침전·슬러지 위험",
    body:
`**문제**: VLSFO는 다양한 원료 블렌드 → 배치마다 화학 조성 다름
**리스크**: 두 배치 섞을 때 asphaltene 침전 → 슬러지 → 연료 시스템 막힘
**TSP (Total Sediment Potential) 테스트**:
   • ASTM D4740 (Spot Test) — 즉시 확인
   • ISO 10307-2 (Hot Filtration) — 정밀
**안전 운영**:
   • 한 배치 다 쓰고 다음 배치 사용
   • 불가피하면 미리 호환성 테스트
   • 탱크 segregation (별도 보관)
**과거 사례**: 2018 Houston/Singapore VLSFO 오염 사건`,
    tags: ["compatibility", "asphaltene", "quality"],
  },

  // ─────── 2. 단위 환산 ───────
  {
    id: "bbl-to-mt", category: "unit-conversion", title: "USD/bbl → USD/MT 변환",
    short: "원유별 비중에 따라 환산 계수 다름",
    body:
`**공식**: USD/MT = USD/bbl × (bbl per MT)
**주요 원유 환산 계수**:
   • Brent:  7.53 bbl/MT
   • WTI:    7.46 bbl/MT
   • Dubai:  7.55 bbl/MT
   • Murban: 7.52 bbl/MT
**예시 계산**:
   • Brent $80/bbl × 7.53 = $602.4/MT
   • WTI $75/bbl × 7.46 = $559.5/MT
**Tip**: 정제유(VLSFO 등)는 비중이 달라 별도 환산. 일반적으로 가솔린 8.5, 디젤 7.3, VLSFO 6.7 bbl/MT`,
    tags: ["unit", "bbl", "conversion"],
  },
  {
    id: "bbl-liter-ton", category: "unit-conversion", title: "bbl ↔ liter ↔ ton",
    short: "1 bbl = 158.987 L · 비중 알아야 ton 환산 정확",
    body:
`**고정 환산**:
   • 1 barrel (bbl) = 42 US gallon = 158.987 liter
   • 1 MT = 1,000 kg
**비중 (density) 활용**:
   • 1 MT = 1,000 kg ÷ 비중 = 부피 (m³)
   • 부피 × 1000 = liter
**주요 연료 비중 (kg/L)**:
   • LSMGO/MGO: ~0.860
   • VLSFO:     ~0.985
   • HSFO/IFO380: ~0.990
   • Brent 원유: ~0.835
**예**: 1 MT VLSFO = 1000 ÷ 0.985 = 1015 L = 6.39 bbl`,
    tags: ["unit", "density", "conversion"],
  },
  {
    id: "fuel-consumption", category: "unit-conversion", title: "연료 소비량 (SFOC) 계산",
    short: "g/kWh 단위로 출력당 소비 추정",
    body:
`**SFOC (Specific Fuel Oil Consumption)**:
   • 저속 디젤 엔진: 170~190 g/kWh
   • 4행정 중속: 190~210 g/kWh
**일일 소비 추정**:
   소비 (MT/day) = 출력 (kW) × 24 × SFOC ÷ 1,000,000
**예시**:
   • 30 MW 메인엔진 × 24h × 180 g/kWh = 129.6 MT/day
   • 6 MW 보조엔진 × 24h × 200 g/kWh = 28.8 MT/day
**Tip**: 실제 운항 출력은 MCR의 60~85%. 풀파워보다 적게 사용`,
    tags: ["consumption", "sfoc", "engine"],
  },
  {
    id: "voyage-cost-formula", category: "unit-conversion", title: "항해 비용 공식",
    short: "거리 → 항해일 → 소비량 → 비용",
    body:
`**단계 1: 항해일 계산**
   항해일 = 거리(NM) ÷ (속도(knots) × 24)
**단계 2: 총 연료 소비**
   총 MT = 항해일 × 일일 소비(MT/day)
**단계 3: 연료비**
   USD = 총 MT × USD/MT
**예시 (Busan → Singapore, ~2,600 NM, 14 knots, 30 MT/day)**:
   • 항해일 = 2600 / (14 × 24) = 7.74일
   • 총 연료 = 7.74 × 30 = 232 MT
   • 가격 $620/MT 가정 → $143,840
**Tip**: 보조엔진/보일러 별도, 입항/정박 연료 추가`,
    tags: ["voyage", "cost", "formula"],
  },

  // ─────── 3. 거래/계약 용어 ───────
  {
    id: "fob-cif", category: "trade-terms", title: "FOB / CIF / EX-Wharf / DDP",
    short: "벙커 인도 조건 4가지 — 가격·책임 범위 차이",
    body:
`**FOB (Free On Board)**: 본선 인도
   • 선박이 봉커링 항으로 가서 받음
   • 운송비 X — 가장 일반적
**CIF (Cost, Insurance, Freight)**: 운송비·보험 포함
   • 벙커 거래에선 거의 안 쓰임
**EX-Wharf / EX-Pipe**: 부두·파이프 직접 인도
   • Singapore, Rotterdam 등 대규모 허브
   • 가장 저렴
**DDP (Delivered Duty Paid)**: 인도 완료 조건
   • 공급자가 모든 비용·리스크 부담
   • 가장 비쌈, 가장 편함
**Tip**: 한국 외항선 대부분 FOB → 본선이 입항해서 직접 인도받음`,
    tags: ["fob", "cif", "incoterms"],
  },
  {
    id: "stem", category: "trade-terms", title: "Stem (스템) 의미",
    short: "벙커 인도 일정·예약을 가리키는 업계 용어",
    body:
`**Stem이란**: 봉커 공급 일정 / 예약
**Stem date**: 인도 예정일 (특정 날짜 또는 윈도우 ±1~2일)
**Confirm stem**: 공급자와 인도 확정
**Stem nomination**: 선사가 공급자에게 인도 요청
**Stem fee / Stem cancellation fee**: 예약 후 취소 시 수수료
**용례**:
   • "What's your stem for VLSFO?" = 봉커 일정 어떻게 돼?
   • "Need to lift stem from 15-17 May" = 5/15~5/17 인도 필요
**일반 흐름**: Quote → Confirm price → Confirm stem → Survey → Delivery → COQ 발급`,
    tags: ["stem", "schedule", "contract"],
  },
  {
    id: "barging-vs-pipe", category: "trade-terms", title: "Barging vs Pipe 인도",
    short: "외정박지 봉커선 인도 vs 부두 파이프 직접 연결",
    body:
`**Barging (봉커선 인도)**:
   • 봉커선(barge)이 본선까지 와서 연결 후 펌프
   • Singapore, Rotterdam 외정박지에서 일반적
   • Barging fee 가격에 포함 (~$5~$10/MT)
   • 날씨 영향 (heavy weather → 인도 불가)
**Pipe / EX-Wharf**:
   • 부두 정박 후 파이프 직접 연결
   • 더 빠르고 저렴
   • 부두 슬롯 예약 필요
**선택**:
   • 신속·저렴 → Pipe (부두 일정 맞아야)
   • 유연성 → Barging (외정박지 가능)
**한국**: 부산·울산 모두 barging 일반적, 일부 pipe`,
    tags: ["barging", "delivery", "logistics"],
  },
  {
    id: "coq", category: "trade-terms", title: "COQ (Certificate of Quality)",
    short: "연료 품질 증명서 — ISO 8217 기준 분석",
    body:
`**COQ란**: 공급자가 발행하는 연료 품질 증명서
**기준**: ISO 8217 (현행 2017 또는 2024 edition)
**주요 항목**:
   • 황 함량 (Sulfur %)
   • 점도 (Viscosity @ 50°C)
   • 비중 (Density)
   • 인화점 (Flash Point)
   • Cat fines (Al+Si)
   • 침전물 (Sediment)
   • 수분 (Water)
**중요성**: 클레임 시 핵심 증거
**병행 권장**:
   • Independent surveyor 샘플 채취 (SGS, Intertek)
   • Lab 분석 (FOBAS, VPS 등) — 1~3일 소요
   • 결과 받기 전 사용 자제`,
    tags: ["coq", "quality", "iso8217"],
  },
  {
    id: "demurrage", category: "trade-terms", title: "Demurrage / Dispatch",
    short: "선박 지연 비용 / 단축 보너스",
    body:
`**Demurrage**: 약정 시간 초과 시 추가 비용
   • 봉커링 시 barge가 본선 도착 후 인도 완료까지 시간 초과
   • Charterer 또는 supplier 부담 (계약 따라)
   • 시간당 또는 일당 정해진 금액
**Dispatch**: 단축 시 보너스 (demurrage 반대)
**Laycan**: 인도 가능 시간 윈도우 (Lay days + Cancelling)
**예**: "Laycan 15-17 May, 24h notice" — 15~17일 사이 인도, 24시간 사전 통보
**Tip**: 입항 지연 시 봉커링도 밀림 → demurrage 확인 필수`,
    tags: ["demurrage", "delay", "charter"],
  },
  {
    id: "spot-vs-term", category: "trade-terms", title: "Spot vs Term Contract",
    short: "스팟(매번 견적) vs Term(고정량 + 가격 공식)",
    body:
`**Spot (스팟 거래)**:
   • 매번 견적, 시장가
   • 유연성 ↑ , 가격 변동 ↑
   • 거래량 적은 선사 위주
**Term (텀 계약)**:
   • 1~12개월 고정량 (월 X톤 등)
   • 가격 공식: Platts 평균 ± premium
   • 안정적 공급, 협상 우위
**한국 정유사 → 선사**: 통상 6~12개월 Term
**Term 가격 공식 예**:
   "Platts Singapore VLSFO MOPS (Mean of Platts Singapore) average of 5 days around BL date + $15 premium"
**Tip**: 시장 변동성 클 때 Term이 유리, 약세장에선 Spot 유리`,
    tags: ["spot", "term", "contract", "mops"],
  },
  {
    id: "bunker-survey", category: "trade-terms", title: "Bunker Survey (벙커 검정)",
    short: "인도량 측정 + 샘플 채취 — 분쟁 예방",
    body:
`**Bunker Survey란**: 인도 시 독립 검정사가 입회·측정
**주요 작업**:
   • Sounding (탱크 잔량 측정) — 전후 비교
   • 온도·비중 측정
   • Representative sample 채취 (drip sample 또는 line sample)
   • 인도량 계산 (Volume × density × VCF)
**비용**: 한 건당 $300~$800 (지역마다 다름)
**누가 부담**: 선사가 통상 부담
**Independent surveyor**: SGS, Intertek, AmSpec, Saybolt, Bureau Veritas
**Tip**: 인도량 분쟁 80%는 sounding 차이 — 양측 입회 필수`,
    tags: ["survey", "sounding", "sampling"],
  },

  // ─────── 4. 시장 구조 ───────
  {
    id: "platts", category: "market-structure", title: "Platts (S&P Global Commodity Insights)",
    short: "가장 권위 있는 가격 평가 (Price Assessment)",
    body:
`**Platts란**: S&P Global Commodity Insights 산하 가격 평가 서비스
**평가 방식**:
   • 매일 거래 데이터 수집 (eWindow, 전화 보고)
   • 트레이더 인터뷰 / 입찰·청약 정보
   • Editor가 종합해 daily assessment 발표
**주요 평가**:
   • MOPS (Mean of Platts Singapore) — 아시아 표준
   • MOPAG (Middle East) / MOPJ (Japan)
   • CIF NWE, FOB Rotterdam (유럽)
   • Brent Dated, Dubai Assessment
**계약 공식 베이스**: 대부분 Term 계약이 Platts MOPS 등 사용
**구독료**: 연 수천만원~ — 일반 트레이더만 접근`,
    tags: ["platts", "assessment", "mops"],
  },
  {
    id: "argus", category: "market-structure", title: "Argus Media",
    short: "Platts 경쟁사 — 중동·러시아·아프리카에서 강점",
    body:
`**Argus**: Platts와 양대 산맥의 가격 평가기관
**강점**:
   • 중동 원유 (Argus Sour Crude Index = ASCI)
   • 러시아 (Urals), 카자흐 (CPC Blend)
   • 아프리카 원유
**OSP 활용**: 사우디·UAE·이라크 등이 ASCI 기준 가격 설정
**한국**: 사우디 원유 수입가 ASCI 연동
**구독료**: Platts와 유사 (연 수천만원+)`,
    tags: ["argus", "asci", "assessment"],
  },
  {
    id: "ship-and-bunker", category: "market-structure", title: "Ship & Bunker (S&B)",
    short: "무료 가격 미디어 — 글로벌 12+ 포트 일일 가격",
    body:
`**S&B**: 영국 기반 벙커 전문 미디어
**제공 데이터**:
   • Singapore, Rotterdam, Fujairah, Houston 등 12+ 포트
   • VLSFO, IFO380, LSMGO 일일 가격
   • 변동, 고/저, 스프레드
   • 산업 뉴스
**정확도**: 일반적으로 Platts와 ±$5/MT 이내
**사용 사례**: 무료 모니터링, Platts 보완 자료
**한계**:
   • Platts MOPS 같은 'official' assessment 아님
   • Term 계약 공식에 사용 불가
**Tip**: 이 앱에서 자동으로 매일 fetch 중`,
    tags: ["sb", "media", "free"],
  },
  {
    id: "physical-trader", category: "market-structure", title: "Physical Trader 역할",
    short: "Vitol, Trafigura, Glencore 등 — 중개·창고·트레이딩",
    body:
`**Physical Trader란**: 정유사가 아닌 거래 전문 회사
**Top 5 (글로벌)**:
   • Vitol — 세계 최대
   • Trafigura
   • Glencore
   • Gunvor
   • Mercuria
**역할**:
   • 정유사와 선사 사이 중개
   • 자체 저장 탱크 운영 (terminal)
   • Spot 거래, 헤지, 차익거래
**마진**: $2~$5/MT
**한국**: 외국 Trader가 한국 정유사에서 사서 외항선에 재판매하는 경우 많음
**물리적 공급자(Physical Supplier)와 구분**:
   • Trader = 중개·트레이딩
   • Supplier = 직접 정제·창고 보유`,
    tags: ["trader", "vitol", "physical"],
  },
  {
    id: "bunker-hubs", category: "market-structure", title: "주요 벙커 허브",
    short: "Singapore, Fujairah, Rotterdam, Houston, ARA 등",
    body:
`**Singapore**: 세계 최대 (~5,000만 MT/년)
   • 모든 등급, 가장 저렴, 24/7 공급
   • MPA 인증 supplier만 가능
**Fujairah (UAE)**: 중동 허브, 인도양 항로
   • Asia-Europe·Asia-Med 항로 중간
   • 호르무즈 해협 외측이라 안전
**Rotterdam (ARA)**: 유럽 최대 (Antwerp-Rotterdam-Amsterdam)
   • 다양한 grade, ECA 내라 LSMGO 활발
**Houston / LA-LB**: 미주 허브
**Hong Kong**: 아시아 보조, Singapore 대안
**Algeciras (Spain)**: 지중해 진입
**Las Palmas (Canary Is.)**: 대서양 횡단 중간
**Panama**: 운하 통과 시
**한국 (Busan, Ulsan)**: 동북아 항로, Singapore 보완`,
    tags: ["hubs", "ports", "singapore", "fujairah"],
  },

  // ─────── 5. 규제 & 환경 ───────
  {
    id: "eu-ets", category: "regulations", title: "EU ETS (배출권 거래제) 해운 포함",
    short: "2024년부터 EU 입출항 선박 CO₂ 비용 부담",
    body:
`**EU ETS란**: EU 탄소배출권 거래제 (Emissions Trading System)
**해운 포함**: 2024년 1월 1일부터
**대상**:
   • EU 항만 입출항 모든 5,000 GT+ 선박
   • EU 내 항해 100%, EU-비EU 항해 50%
**단계적 적용**:
   • 2024년: 배출량의 40%
   • 2025년: 70%
   • 2026년 이후: 100%
**비용**: 선박이 CO₂ 1톤당 EUA 1매 매입 → 2026년 현재 €60~€90/EUA
**연료별 CO₂ 환산** (1 MT 연료당):
   • VLSFO/HSFO: ~3.15 톤 CO₂
   • LSMGO: ~3.21 톤 CO₂
   • LNG: ~2.75 톤 CO₂
**예시**: VLSFO 500 MT × 3.15 × €80 = €126,000 (EU 입항 추가비용)`,
    tags: ["ets", "eu", "carbon", "regulation"],
  },
  {
    id: "marpol-vi", category: "regulations", title: "MARPOL Annex VI (대기오염 규제)",
    short: "국제 해사 규제 — SOx · NOx · 입자상물질",
    body:
`**MARPOL Annex VI**: IMO MARPOL 협약 부속서 VI
**규제 항목**:
   • SOx (황산화물) — 0.5% Cap, ECA 0.1%
   • NOx (질소산화물) — Tier I/II/III
   • Particulate Matter (입자)
   • Ozone Depleting Substances
   • VOC (휘발성유기화합물)
**Tier III NOx**:
   • 2016 이후 건조 + ECA 운항 시 적용
   • Tier II 대비 80% 감축
   • SCR (선택적환원촉매) 또는 EGR 장치 필요
**EEDI (Energy Efficiency Design Index)**:
   • 신조선 효율 등급
   • Phase 0~3 단계적 강화`,
    tags: ["marpol", "imo", "sox", "nox"],
  },
  {
    id: "cii", category: "regulations", title: "CII (Carbon Intensity Indicator)",
    short: "선박별 연료 효율 등급제 (A~E) · 2023년 시행",
    body:
`**CII란**: 선박 단위 운항 효율 측정 — 연 등급 A~E
**계산**: CO₂ 배출량 ÷ (DWT × 거리)
**등급**:
   • A: 최우수
   • B: 우수
   • C: 보통 (요구 기준 충족)
   • D: 미달 (1년)
   • E: 심각 미달 (즉시 개선계획 제출)
**D 등급 3년 연속 또는 E 등급 → 운항 제한 가능**
**개선 방법**:
   • Slow steaming (속도 감소)
   • Hull cleaning, propeller polishing
   • Engine performance tuning
   • 대체연료 비율 ↑
**2030 목표**: 기준선 대비 40% 강화`,
    tags: ["cii", "imo", "efficiency"],
  },
  {
    id: "imo-net-zero", category: "regulations", title: "IMO 2030 / 2050 GHG 전략",
    short: "해운 탄소 감축 글로벌 로드맵",
    body:
`**IMO GHG Strategy** (2023 개정):
**2030 목표**: 2008년 대비 CO₂ **20~30%** 감축
**2040 목표**: 70~80% 감축
**2050 목표**: 넷제로 (Net Zero)
**경로**:
   • 효율 개선 (EEXI, CII)
   • 대체연료 (LNG → 메탄올 → 암모니아)
   • Wind assist, 태양광, 배터리 하이브리드
**규제 도구**:
   • 2027 예상: 글로벌 탄소세 (carbon levy)
   • Mid-term measure 협상 중
**비용 추정**: 2030년까지 글로벌 해운 추가비용 연 $500억+`,
    tags: ["imo", "ghg", "net-zero", "2050"],
  },
  {
    id: "korea-ets", category: "regulations", title: "한국 ETS 적용 가능성",
    short: "현재 해운 ETS 대상 아님 — 향후 적용 검토",
    body:
`**한국 K-ETS**:
   • 2015년 도입 (산업·발전 부문 위주)
   • 해운은 현재 미포함
**검토 단계**: 환경부 + 해수부 협의 중
**예상 시점**: 2027~2030
**EU ETS 영향**: EU 입항 한국 선박은 이미 EU ETS 대상
**대비 전략**:
   • CII A/B 등급 유지
   • 대체연료 비율 점진적 확대
   • 탄소 비용을 운임에 반영하는 BAF surcharge`,
    tags: ["korea", "ets", "regulation"],
  },

  // ─────── 6. 선박 운영 상식 ───────
  {
    id: "ship-types", category: "ship-ops", title: "선박 종류별 톤수 & 소비량",
    short: "VLCC / Capesize / Panamax / Feeder 등 비교",
    body:
`**탱커 (원유 운반)**:
   • VLCC (200K+ DWT): 60~80 MT/day
   • Suezmax (150K): 50~60 MT/day
   • Aframax (80K): 35~45 MT/day
**벌커 (건화물)**:
   • Capesize (180K+): 50~60 MT/day
   • Panamax (75K): 25~35 MT/day
   • Handysize (35K): 15~25 MT/day
**컨테이너**:
   • Mega (22K+ TEU): 200+ MT/day
   • ULCS (14K TEU): 100~150 MT/day
   • Feeder (2K TEU): 30~50 MT/day
**LNG 운반선**:
   • 174K m³: 80~100 MT/day (LNG fuel)
**Tip**: 풀파워 기준. 실제 운항은 60~85%로 더 적음`,
    tags: ["ship", "vlcc", "capesize", "consumption"],
  },
  {
    id: "cube-law", category: "ship-ops", title: "속도³ 법칙 (Cube Law)",
    short: "연료 소비 ∝ 속도³ → 감속하면 연료 크게 절감",
    body:
`**원리**: 연료 소비량은 속도의 세제곱에 비례
   F ∝ V³
**실제 예시**:
   • 14 knots → 12 knots (속도 14% ↓) → 연료 36% ↓
   • 14 knots → 10 knots (속도 29% ↓) → 연료 64% ↓
   • 반대로 14 → 15 knots (7% ↑) → 연료 23% ↑
**Slow steaming 경제학**:
   • 연료 절감 vs 항해일 증가
   • 운임이 낮을 때 유리
   • 2009년 이후 일반화
**제한 요인**:
   • Charter party 속도 약정
   • 화물 인도 일정
   • 엔진 최소 운전 부하`,
    tags: ["cubelaw", "speed", "slow-steaming"],
  },
  {
    id: "slow-steaming", category: "ship-ops", title: "Slow Steaming 경제성",
    short: "감속 → 연료비 절감 vs 항해 비용 증가",
    body:
`**계산 예시 (Singapore → Rotterdam, 8,500 NM)**:

**Normal (14 knots)**:
   • 항해일: 25.3일
   • 연료: 75 MT/day × 25.3 = 1,898 MT
   • 연료비: 1,898 × $620 = $1.18M

**Slow (10 knots)**:
   • 항해일: 35.4일
   • 연료: 27 MT/day × 35.4 = 956 MT (cube law)
   • 연료비: 956 × $620 = $593K
   • **절감: $584K**
   • 추가 항해 비용 (charter rate × 10일): 운임에 따라 다름

**최적점**: 운임 / 연료가 따라 다름. 운임 낮을 때 8~10 knots 가능`,
    tags: ["slow-steaming", "economics"],
  },
  {
    id: "main-aux-engine", category: "ship-ops", title: "메인엔진 / 보조엔진 / 보일러",
    short: "엔진별 연료 사용 패턴",
    body:
`**메인엔진 (Main Engine)**:
   • 추진용 저속 디젤 (2-stroke)
   • 연료: VLSFO 또는 HSFO+스크러버
   • 출력: 20~80 MW (선박 크기별)
**보조엔진 (Auxiliary Engine, A/E)**:
   • 전력 생산용 중속 4-stroke
   • 연료: LSMGO 또는 VLSFO
   • 항만 정박 시 메인엔진 정지, A/E만 가동
**보일러 (Boiler)**:
   • 스팀 생산 (히팅, 청수 생산)
   • Inert gas (탱커)
**연료 사용 패턴**:
   • 항해 중: ME 80% + AE 15% + Boiler 5%
   • 항만 정박: AE 60% + Boiler 40%
   • Cold ironing (육상전력 연결) 시 모두 OFF`,
    tags: ["engine", "main", "auxiliary", "boiler"],
  },

  // ─────── 7. 시장 지표 해설 ───────
  {
    id: "brent-dubai-efs", category: "indicators", title: "Brent-Dubai EFS (Exchange For Swaps)",
    short: "아시아 정유 마진 핵심 지표",
    body:
`**EFS란**: Brent 선물 ↔ Dubai 스왑 가격차 거래
**의미**: 두 벤치마크 간 상대 가치
**평균 범위**: $1~$3/bbl (좁을 때 ~$0.5, 넓을 때 $5+)
**해석**:
   • EFS 넓음 (>$3) → Brent가 Dubai보다 비쌈 → 중동 원유 매력 ↑
     → 아시아 정유사가 사우디·UAE 원유 더 사고, 유럽·아프리카 줄임
   • EFS 좁음 (<$1) → Dubai 상대 비쌈 → 서아프리카·미국 원유 분산 매수
   • EFS Negative (드물게) → Dubai > Brent → 중동 공급 매우 타이트
**한국 영향**:
   • 사우디 ARAMCO OSP가 EFS 기반
   • EFS 넓으면 사우디 가격 매력적
**거래**: ICE Brent + Platts Dubai swap 차익거래`,
    tags: ["efs", "brent", "dubai", "arbitrage"],
  },
  {
    id: "hi5-spread", category: "indicators", title: "Hi-5 Spread (VLSFO − HSFO)",
    short: "VLSFO와 HSFO 가격차 — 스크러버 경제성 직결",
    body:
`**Hi-5란**: "High-5" = VLSFO 프리미엄 over HSFO/IFO380
**정상 범위**: $80~$200/MT
**계산**: VLSFO Singapore − IFO380 Singapore
**경제성 의미**:
   • Spread 클수록 스크러버 ROI 빠름
   • Spread $200+ : 스크러버 2~3년 회수
   • Spread $50 이하 : 스크러버 무의미
**역사**:
   • IMO 2020 시행 직후 (2020 Q1): $300+ (충격적 widening)
   • 2020년 코로나 후: $50 미만 (HSFO 수요 폭락)
   • 2022~2023: $100~$200 (정상화)
**전망**: 장기적으로 점차 narrow 추세 (HSFO 시장 축소)`,
    tags: ["hi5", "spread", "scrubber"],
  },
  {
    id: "contango-backwardation", category: "indicators", title: "Contango / Backwardation",
    short: "선물 곡선 모양으로 시장 상태 판단",
    body:
`**Contango (콘탱고)**:
   • 선물 곡선 우상향 (M1 < M2 < M3...)
   • 시장 의미: 현재 공급 충분, 미래 수요 기대
   • 저장 인센티브 (사놓고 나중에 비싸게)
   • 전형 시기: 약세장
**Backwardation (백워데이션)**:
   • 선물 곡선 우하향 (M1 > M2 > M3...)
   • 시장 의미: 현재 공급 타이트, 미래 완화 기대
   • 보유 인센티브 없음 → 현재 매수 유리
   • 전형 시기: 강세장, 지정학 긴장
**Brent 현재 상태** (앱 대시보드에서 확인 가능):
   • Forward curve M1→M6 차이로 백워데이션/콘탱고 판단
**헤지 전략**:
   • 백워데이션: 현물 비싸지만 미래 하락 기대 → 단기 매수
   • 콘탱고: 시점 분산 매수 (시간 평균)`,
    tags: ["contango", "backwardation", "forward"],
  },
  {
    id: "crack-spread", category: "indicators", title: "Crack Spread (정제 마진)",
    short: "(제품가 − 원유가) — 정유사 마진 지표",
    body:
`**Crack Spread란**: 정제 제품 가격 - 원유 가격
**3-2-1 Crack** (가장 흔한 정의):
   • 원유 3 배럴 → 가솔린 2 + 디젤 1
   • (2×가솔린 + 1×디젤 - 3×원유) / 3
**정유사 마진 측정**:
   • Crack 넓음 → 정유사 이익 ↑ → 정제율 ↑
   • Crack 좁음 → 정유사 이익 ↓ → 정제율 ↓ (감산)
**벙커 연료 (잔사유) 영향**:
   • Crack 좁아지면 정유사가 정제 줄임 → 모든 제품(벙커 포함) 공급 감소 → 가격 ↑
   • 벙커는 잔사유라 negative crack 가능 (원유보다 쌈)
**계절성**:
   • 여름 (드라이빙 시즌): 가솔린 crack ↑
   • 겨울: 디젤·난방유 crack ↑`,
    tags: ["crack", "refining", "margin"],
  },

  // ─────── 8. 한국 시장 특화 ───────
  {
    id: "korea-ports", category: "korea", title: "한국 주요 봉커링 포트",
    short: "Busan / Ulsan / Yeosu / Gwangyang 비교",
    body:
`**Busan (부산)**:
   • 동북아 환적 허브 (최대 컨테이너 항)
   • 모든 등급 봉커 가능
   • 정유사 직공급 + Trader
   • 한국 봉커 거래 50%+
**Ulsan (울산)**:
   • 정유사 본거지 (SK이노베이션, S-Oil, HD현대오일뱅크)
   • 직공급 가장 유리, 가격 경쟁력
   • 탱커 봉커링 강함
**Yeosu (여수)**:
   • GS Caltex 본거지
   • 서남부 최대 컨테이너 + 봉커
**Gwangyang (광양)**:
   • POSCO 연계, 산업·벌커
   • 일부 봉커 가능
**Singapore vs 한국**:
   • 한국이 통상 +$10~$25/MT 비쌈
   • 단, 동북아 항해 시 시간 절약`,
    tags: ["korea", "busan", "ulsan", "ports"],
  },
  {
    id: "korea-suppliers", category: "korea", title: "한국 4대 정유사 + 공급사",
    short: "SK / GS / S-Oil / HD현대오일뱅크",
    body:
`**SK이노베이션 (구 SK에너지)**:
   • 위치: 울산
   • 최대 정제능력 84만 bbl/day
   • 자회사 SK Trading International (해외 트레이딩)
**GS Caltex**:
   • 위치: 여수 (싱글 단지)
   • 정제능력 80만 bbl/day
   • Chevron 합작
**S-Oil**:
   • 위치: 울산
   • 사우디 ARAMCO 자회사 (지분 63%)
   • 정제능력 67만 bbl/day, RUC 보유 (잔사유 업그레이드)
**HD현대오일뱅크**:
   • 위치: 대산
   • 정제능력 65만 bbl/day
   • 현대중공업그룹 계열
**시장 점유**: 4사가 한국 정제 95%+ 차지
**공급 채널**:
   • 정유사 직접 (Term)
   • Trader 경유 (한국 시장 + 외국 trader)`,
    tags: ["korea", "refinery", "sk", "gs", "s-oil"],
  },
  {
    id: "bonded-fuel", category: "korea", title: "보세유 vs 국내유",
    short: "외항선 (보세유) vs 내항선 (국내유) — 세금 차이",
    body:
`**보세유 (Bunker / Bonded Fuel)**:
   • 외항선용 (국제 항해)
   • VAT 0%, 관세 0%
   • 가장 흔한 봉커 거래
   • 출항 증빙 필수 (외국으로 출항 확인)
**국내유 (Domestic)**:
   • 내항선·산업용
   • VAT 10% 부가
   • 가격 차이 큼 (10%+)
**구분 핵심**:
   • 외항 출항 여부
   • Customs (관세청) 신고
   • 잘못 적용 시 추징 가능
**Tip**: 외항선이라도 한국 영해 내 운항만 하면 보세 적용 안 될 수 있음`,
    tags: ["bonded", "vat", "tax", "korea"],
  },
  {
    id: "korea-premium", category: "korea", title: "Singapore vs 한국 프리미엄",
    short: "통상 +$10~$25/MT — 운임 + 시장 프리미엄",
    body:
`**한국 = Singapore + Premium**:
   • Spot 시장 평균: +$10~$25/MT (VLSFO 기준)
   • IFO380: +$15~$30/MT
   • LSMGO: +$15~$40/MT
**프리미엄 구성**:
   • Singapore-Korea 운임 (~$5~$10)
   • 한국 시장 supply tightness
   • 단기 변동성 보상
**확대 시기**:
   • 동절기 (난방유 수요 ↑)
   • 정유사 정기 보수 (TA: Turnaround)
   • 지정학 이슈 (호르무즈 긴장 등)
**축소 시기**:
   • Singapore 공급 과잉
   • 한국 정유 마진 좋아 봉커 공급 ↑
**Tip**: 정유사 Term 계약은 Platts MOPS + premium 형태가 일반적`,
    tags: ["korea", "premium", "singapore"],
  },
  {
    id: "komsa", category: "korea", title: "KOMSA / KMI 등 한국 해사 기관",
    short: "통계·정책 지원 기관 — 직접 가격 평가는 X",
    body:
`**KOMSA (한국해양수산개발원)**:
   • 해운·수산 정책 연구
   • 시장 통계 자료
   • 가격 직접 평가는 안 함
**KMI (한국해양수산개발원)**: KOMSA의 영문명
**KSA (한국선주협회)**:
   • 한국 선사 이익단체
   • 정책 건의
**KR (한국선급)**:
   • 선박 검사·인증
   • IMO 규제 컨설팅
**MOEL / MOLIT**:
   • 환경부, 국토교통부 (해양수산부 주관)
**Tip**: 한국 시장 가격은 Trader 견적 또는 정유사 직접 문의가 정확`,
    tags: ["korea", "komsa", "kmi", "agency"],
  },

  // ─────── 9. 대체 연료 ───────
  {
    id: "lng-bunker", category: "alt-fuels", title: "LNG Bunker (액화천연가스)",
    short: "−162°C · CO₂ 25% · SOx 100% · NOx 90% 감축",
    body:
`**LNG**: Liquefied Natural Gas (액화천연가스)
**저장**: -162°C 극저온 (cryogenic tank)
**배출 감축**:
   • CO₂: 약 25% 감축
   • SOx: 100% 감축 (황 0)
   • NOx: 약 90% 감축
**Methane Slip** 문제:
   • 미연소 메탄 (CH₄) 배출 = GHG 강력 (CO₂의 28~84배)
   • 엔진 효율·디자인에 따라 0.2%~3%
**가용 항만**: Singapore, Rotterdam, Zeebrugge, Yokohama, 부산
**가격**: VLSFO와 비슷~+20% (LNG 시장 변동성 큼)
**선박 사례**:
   • CMA CGM 22K TEU 컨테이너
   • Total LNG-fueled VLCC
**한계**: 인프라 구축 필요, 보일오프 손실`,
    tags: ["lng", "altfuel", "methane"],
  },
  {
    id: "methanol", category: "alt-fuels", title: "Methanol 메탄올",
    short: "Maersk 등 대형 발주 진행 · 회색/녹색 구분",
    body:
`**Methanol (CH₃OH)**:
   • 액체 (상온·상압)
   • 인프라 비교적 단순 (LNG 대비)
**탄소 감축**:
   • 회색 메탄올 (천연가스 유래): 7~10% 감축
   • 청색 메탄올 (CCS 포함): 25~50%
   • 녹색 메탄올 (재생가능): 80~100%
**가격**:
   • 회색: VLSFO 대비 +50% 이상
   • 녹색: VLSFO 대비 +200% 이상
**선박 발주**:
   • Maersk: 18척+ (2024~2027 인도)
   • CMA CGM, Cosco도 발주
**가용 항만**: 제한적 — Singapore, Rotterdam, 한국(울산)`,
    tags: ["methanol", "altfuel", "maersk"],
  },
  {
    id: "ammonia", category: "alt-fuels", title: "Ammonia (NH₃) 암모니아",
    short: "탄소 zero · 2030 이후 상용화",
    body:
`**Ammonia (NH₃)**:
   • 연소 시 CO₂ X (수소 + 질소만)
   • 탄소 zero 가능
**과제**:
   • 독성 (피부·호흡기 손상)
   • 폭발성 (NOx 다량 배출)
   • 에너지 밀도 낮음 (VLSFO의 ~40%)
**상용화 일정**:
   • 2025~2028: 시범 운항
   • 2030: 본격 상용
   • 2040+: 주류 가능
**선박 디자인**: Dual-fuel 엔진 (NH₃ + pilot fuel)
**그린 암모니아**:
   • 재생전력 → 그린수소 → 그린암모니아
   • 가격 매우 비싸 (현재 VLSFO 5~10배)
**한국**: HD현대중공업 NH₃ 엔진 개발 중`,
    tags: ["ammonia", "altfuel", "zero-carbon"],
  },
  {
    id: "future-roadmap", category: "alt-fuels", title: "연료 전환 로드맵 (예상)",
    short: "2025 LNG → 2030 메탄올 → 2040 암모니아",
    body:
`**~2025**:
   • VLSFO + B24/B30 (바이오) 주류
   • LNG 점진 확산
   • 스크러버 + HSFO 일부
**2025~2030**:
   • LNG 대중화
   • 메탄올 상용 (Maersk 사례)
   • EU ETS 본격 영향
**2030~2040**:
   • 메탄올 시장 점유 ↑
   • 암모니아 시범~상용
   • 그린 연료 비중 증가
**2040~2050**:
   • 암모니아 본격
   • 그린 메탄올
   • Net Zero (IMO 목표)
**투자 우선순위 (개인 의견)**:
   • 신조선: Dual-fuel (메탄올 또는 LNG)
   • 기존선: B24/B30 사용, CII 등급 관리`,
    tags: ["roadmap", "future", "transition"],
  },

  // ─────── 10. 빠른 계산 ───────
  {
    id: "calc-bbl-mt", category: "calculators", title: "USD/bbl ↔ USD/MT 환산",
    short: "원유별 환산 계수 — 빠른 암산 가이드",
    body:
`**Brent (7.53 bbl/MT)**:
   $80/bbl → $602/MT
   $85/bbl → $640/MT
   $90/bbl → $678/MT
   $100/bbl → $753/MT
**WTI (7.46 bbl/MT)**:
   $75/bbl → $560/MT
   $80/bbl → $597/MT
   $90/bbl → $671/MT
**Dubai (7.55 bbl/MT)**:
   $80/bbl → $604/MT
   $90/bbl → $680/MT
**암산 팁**: × 7.5 + 약간 → 빠르게 MT 가격 추정
**역산**: USD/MT ÷ 7.5 ≈ USD/bbl`,
    tags: ["calc", "conversion", "bbl"],
  },
  {
    id: "calc-voyage", category: "calculators", title: "항해 비용 추정 (예시)",
    short: "Busan → Singapore / Rotterdam 케이스",
    body:
`**Case 1: Busan → Singapore (~2,600 NM, 14 knots, 30 MT/day)**
   • 항해일: 2,600 / (14 × 24) = 7.7일
   • 총 연료: 7.7 × 30 = 231 MT
   • 가격 $620/MT → **연료비 $143K**

**Case 2: Busan → Rotterdam (Suez 경유, ~10,500 NM, 14 knots, 60 MT/day)**
   • 항해일: 10,500 / 336 = 31.3일
   • 총 연료: 31.3 × 60 = 1,876 MT
   • $620/MT → **$1.16M** + Suez 통과료 + EU ETS

**Case 3: Busan → LA-LB (~5,600 NM, 18 knots, 100 MT/day, 컨테이너)**
   • 항해일: 5,600 / 432 = 13일
   • 총 연료: 13 × 100 = 1,300 MT
   • $620 → **$806K**

**Tip**: 보조엔진(15~30 MT/day) 별도 계산`,
    tags: ["calc", "voyage", "cost"],
  },
  {
    id: "calc-krw", category: "calculators", title: "KRW 환산",
    short: "USD/MT × 환율 = KRW/MT",
    body:
`**기본 공식**: USD/MT × USD/KRW = KRW/MT
**예시 (환율 1,370 KRW/USD 가정)**:
   • $620/MT × 1,370 = 849,400 KRW/MT
   • $800/MT × 1,370 = 1,096,000 KRW/MT
**원유 USD/bbl → KRW/L**:
   • USD/bbl × 환율 ÷ 158.987
   • $80 × 1,370 / 158.987 = 689 KRW/L (세전, 정제마진 X)
**환율 변동 영향**:
   • 1,300 → 1,400 (7.7% 약세)
   • 같은 USD 가격이라도 KRW로는 7.7% 비싸짐
**헤지**: 대량 거래는 FX forward 또는 옵션`,
    tags: ["calc", "krw", "currency"],
  },
];
