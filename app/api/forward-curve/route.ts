import { NextResponse } from "next/server";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

// Brent 월별 선물 ticker 코드: F=Jan, G=Feb, H=Mar, J=Apr, K=May, M=Jun,
// N=Jul, Q=Aug, U=Sep, V=Oct, X=Nov, Z=Dec
const MONTH_CODES = ["F","G","H","J","K","M","N","Q","U","V","X","Z"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface YahooResult {
  meta?: { regularMarketPrice?: number; symbol?: string };
}
interface YahooChart { chart?: { result?: YahooResult[]; error?: { code: string } } }

async function yahooQuote(symbol: string): Promise<{ price: number; symbol: string } | null> {
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;

  const attempts: Array<() => Promise<YahooChart | null>> = [
    async () => {
      const r = await fetch(yahooUrl, { headers: { "User-Agent": UA, Accept: "application/json" }, next: { revalidate: 1800 } });
      return r.ok ? await r.json() : null;
    },
    async () => {
      const r = await fetch(`https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`, { headers: { "User-Agent": UA }, next: { revalidate: 1800 } });
      return r.ok ? await r.json() : null;
    },
  ];

  for (const attempt of attempts) {
    try {
      const data = await attempt();
      const p = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      const sym = data?.chart?.result?.[0]?.meta?.symbol;
      if (typeof p === "number" && p > 30 && p < 300) {
        return { price: +p.toFixed(2), symbol: sym ?? symbol };
      }
    } catch { /* next attempt */ }
  }
  return null;
}

function buildMonthSymbols(count: number) {
  // 오늘부터 +1개월씩 진행하며 contract symbol 생성. 만료된 월은 호출 시 실패하니 skip.
  const today = new Date();
  const result: Array<{ symbol: string; year: number; monthIdx: number; label: string; shortLabel: string }> = [];
  for (let offset = 1; offset <= count + 4; offset++) {
    const target = new Date(today.getUTCFullYear(), today.getUTCMonth() + offset, 1);
    const monthIdx = target.getMonth();
    const year = target.getFullYear();
    const yy = String(year % 100).padStart(2, "0");
    result.push({
      symbol: `BZ${MONTH_CODES[monthIdx]}${yy}.NYM`,
      year,
      monthIdx,
      label: `${MONTH_NAMES[monthIdx]} ${year}`,
      shortLabel: `${MONTH_NAMES[monthIdx]} ${yy}`,
    });
  }
  return result;
}

export async function GET() {
  const candidates = buildMonthSymbols(6);
  // 병렬로 다 시도, 가장 가까운 6개월 선물 추출
  const results = await Promise.all(candidates.map(c => yahooQuote(c.symbol)));

  const curve: Array<{ symbol: string; label: string; shortLabel: string; price: number }> = [];
  for (let i = 0; i < candidates.length && curve.length < 6; i++) {
    const r = results[i];
    if (r) curve.push({ symbol: candidates[i].symbol, label: candidates[i].label, shortLabel: candidates[i].shortLabel, price: r.price });
  }

  // M1, M2 ... 라벨 추가
  const enriched = curve.map((c, i) => ({ ...c, mLabel: `M${i + 1}` }));

  // 백워데이션 / 콘탱고 판단
  const m1 = enriched[0]?.price ?? null;
  const last = enriched[enriched.length - 1]?.price ?? null;
  let structure: "backwardation" | "contango" | "flat" | null = null;
  let spread: number | null = null;
  if (m1 != null && last != null) {
    spread = +(last - m1).toFixed(2);
    if (spread < -0.5) structure = "backwardation";
    else if (spread > 0.5) structure = "contango";
    else structure = "flat";
  }

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    curve: enriched,
    structure,
    m1ToLastSpread: spread,
  });
}
