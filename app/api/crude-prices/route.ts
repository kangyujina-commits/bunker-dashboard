import { NextResponse } from "next/server";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

interface YahooQuote { close?: (number | null)[] }
interface YahooResult { timestamp?: number[]; indicators?: { quote?: YahooQuote[] } }
interface YahooChart { chart?: { result?: YahooResult[] } }

// Yahoo Finance가 Vercel 서버 IP를 자주 차단하므로 직접 → 여러 프록시 순차 시도
async function yahooChart(ticker: string, range: string, noStore: boolean): Promise<YahooChart | null> {
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=${range}`;
  const fetchOpts: RequestInit & { next?: { revalidate: number } } = {
    headers: { "User-Agent": UA, Accept: "application/json" },
    ...(noStore ? { cache: "no-store" as const } : { next: { revalidate: 3600 } }),
  };

  const attempts: Array<() => Promise<YahooChart | null>> = [
    async () => {
      const res = await fetch(yahooUrl, fetchOpts);
      if (!res.ok) return null;
      const data = (await res.json()) as YahooChart;
      return data?.chart?.result?.[0] ? data : null;
    },
    async () => {
      const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`, fetchOpts);
      if (!res.ok) return null;
      const data = (await res.json()) as YahooChart;
      return data?.chart?.result?.[0] ? data : null;
    },
    async () => {
      const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`, fetchOpts);
      if (!res.ok) return null;
      const data = (await res.json()) as YahooChart;
      return data?.chart?.result?.[0] ? data : null;
    },
  ];

  for (const attempt of attempts) {
    try {
      const result = await attempt();
      if (result) return result;
    } catch { /* try next */ }
  }
  return null;
}

// oilprice.com에서 Dubai 원유 실제 평가가격 스크레이핑
// 페이지 HTML에 <tr data-name='Dubai' data-id='144'> 행이 있고
// 그 안에 <td class='last_price' data-price='97.6'>가 들어있음
// (Dubai는 OTC 평가가격이라 보통 2~4일 지연되지만 실제 가격임)
async function fetchDubaiFromOilPrice(noStore: boolean): Promise<{ price: number; delay: string } | null> {
  try {
    const res = await fetch("https://oilprice.com/oil-price-charts/", {
      headers: {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      ...(noStore ? { cache: "no-store" } : { next: { revalidate: 3600 } }),
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Dubai row 추출
    const rowMatch = html.match(/data-name='Dubai'[^>]*>([\s\S]*?)<\/tr>/);
    if (!rowMatch) return null;
    const row = rowMatch[1];
    const priceMatch = row.match(/data-price='([0-9.]+)'/);
    if (!priceMatch) return null;
    const price = parseFloat(priceMatch[1]);
    if (!(price > 30 && price < 300)) return null;
    const delayMatch = row.match(/\(([^)]*[Dd]elay)\)/);
    const delay = delayMatch ? delayMatch[1] : "current";
    return { price, delay };
  } catch {
    return null;
  }
}

// oilprice.com chart endpoint: blend_id=144 (Dubai), period: 4=1mo, 5=1y, 7=5y
// CSRF + cookie session flow 필요
function extractCookies(res: Response): string {
  type HdrsWithGetSetCookie = Headers & { getSetCookie?: () => string[] };
  const h = res.headers as HdrsWithGetSetCookie;
  const setCookies: string[] = h.getSetCookie ? h.getSetCookie() : [];
  return setCookies.map(c => c.split(";")[0]).filter(Boolean).join("; ");
}

async function fetchDubaiHistoryOilPrice(period: number): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  try {
    // Step 1: warm cookies (oil-price-charts page)
    const warmRes = await fetch("https://oilprice.com/oil-price-charts/", {
      headers: { "User-Agent": UA, "Accept": "text/html" },
      next: { revalidate: 3600 },
    });
    const warmCookies = extractCookies(warmRes);

    // Step 2: get CSRF token
    const csrfRes = await fetch("https://oilprice.com/ajax/csrf", {
      headers: {
        "User-Agent": UA,
        ...(warmCookies ? { Cookie: warmCookies } : {}),
      },
      cache: "no-store",
    });
    if (!csrfRes.ok) return result;
    const csrfCookies = extractCookies(csrfRes);
    const allCookies = [warmCookies, csrfCookies].filter(Boolean).join("; ");
    const csrf = await csrfRes.json() as { name?: string; hash?: string };
    if (!csrf.name || !csrf.hash) return result;

    // Step 3: POST chart data request
    const body = new URLSearchParams({
      blend_id: "144",
      period: String(period),
      [csrf.name]: csrf.hash,
    });
    const dataRes = await fetch("https://oilprice.com/freewidgets/json_get_oilprices", {
      method: "POST",
      headers: {
        "User-Agent": UA,
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        ...(allCookies ? { Cookie: allCookies } : {}),
      },
      body: body.toString(),
      cache: "no-store",
    });
    if (!dataRes.ok) return result;
    const data = await dataRes.json() as { prices?: Array<{ time: number; price: string | number }> };
    if (!Array.isArray(data.prices)) return result;
    for (const p of data.prices) {
      const v = typeof p.price === "string" ? parseFloat(p.price) : p.price;
      if (!isFinite(v) || v < 30 || v > 300) continue;
      const iso = new Date(p.time * 1000).toISOString().slice(0, 10);
      result.set(iso, +v.toFixed(2));
    }
  } catch { /* ignore */ }
  return result;
}

// Stooq CSV: 안정적이고 차단 없음. WTI=cl.f, Brent=cb.f
async function stooqDaily(symbol: string, days: number): Promise<Array<{ date: string; close: number }>> {
  const today = new Date();
  const from = new Date(today.getTime() - (days + 5) * 86400_000);
  const fmt = (d: Date) => `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  const url = `https://stooq.com/q/d/l/?s=${symbol}&d1=${fmt(from)}&d2=${fmt(today)}&i=d`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const csv = await res.text();
    const lines = csv.trim().split("\n").slice(1);
    return lines.map(line => {
      const [date, , , , close] = line.split(",");
      return { date, close: parseFloat(close) };
    }).filter(r => !isNaN(r.close));
  } catch {
    return [];
  }
}

function lastNum(arr: (number | null)[] | undefined): number | null {
  if (!arr) return null;
  for (let i = arr.length - 1; i >= 0; i--) {
    const v = arr[i];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "1y";
  const noStore = request.headers.get("cache-control") === "no-store";
  const days = range === "30d" || range === "1mo" ? 30 : 365;

  // WTI / Brent: Stooq CSV (안정), 실패시 Yahoo로 fallback
  // Dubai: oilprice.com 평가가격 (실제값, 2~4일 지연), 실패 시 Brent - $1.5
  // Dubai 차트: oilprice chart endpoint (period 5=1년, 4=1개월)
  const oilpricePeriod = days <= 31 ? 4 : 5;
  const [wtiStooq, brentStooq, dubaiOP, dubaiHistMap] = await Promise.all([
    stooqDaily("cl.f", days),
    stooqDaily("cb.f", days),
    fetchDubaiFromOilPrice(noStore),
    fetchDubaiHistoryOilPrice(oilpricePeriod),
  ]);

  // Stooq에서 못 받았으면 Yahoo fallback
  const [wtiYahoo, brentYahoo] = await Promise.all([
    wtiStooq.length === 0 ? yahooChart("CL=F", range, noStore) : Promise.resolve(null),
    brentStooq.length === 0 ? yahooChart("BZ=F", range, noStore) : Promise.resolve(null),
  ]);

  // 통합된 날짜→가격 맵
  const wByDate = new Map<string, number>();
  const bByDate = new Map<string, number>();
  wtiStooq.forEach(r => wByDate.set(r.date, +r.close.toFixed(2)));
  brentStooq.forEach(r => bByDate.set(r.date, +r.close.toFixed(2)));

  // Yahoo fallback 데이터 병합
  const ingestYahoo = (chart: YahooChart | null, target: Map<string, number>) => {
    const r = chart?.chart?.result?.[0];
    const closes = r?.indicators?.quote?.[0]?.close ?? [];
    const ts = r?.timestamp ?? [];
    ts.forEach((t, i) => {
      const v = closes[i];
      if (typeof v === "number") {
        const iso = new Date(t * 1000).toISOString().slice(0, 10);
        if (!target.has(iso)) target.set(iso, +v.toFixed(2));
      }
    });
  };
  ingestYahoo(wtiYahoo, wByDate);
  ingestYahoo(brentYahoo, bByDate);

  // Dubai: oilprice.com 실제 평가가격 우선
  let dubaiLatest: number | null = null;
  let dubaiSource = "";
  if (dubaiOP) {
    dubaiLatest = +dubaiOP.price.toFixed(2);
    dubaiSource = `OilPrice.com${dubaiOP.delay && dubaiOP.delay !== "current" ? ` · ${dubaiOP.delay}` : ""}`;
  }

  // 통합 날짜축: WTI 기준 (가장 풍부)
  const sortedDates = [...wByDate.keys()].sort();
  const wLatestDate = sortedDates.at(-1);
  const wtiLatestVal = wLatestDate ? wByDate.get(wLatestDate) ?? null : null;
  const sortedBrent = [...bByDate.keys()].sort();
  const brentLatestVal = sortedBrent.length ? bByDate.get(sortedBrent.at(-1)!) ?? null : null;

  if (dubaiLatest === null && brentLatestVal != null) {
    dubaiLatest = +(brentLatestVal - 1.5).toFixed(2);
    dubaiSource = "Brent ≈ -$1.5";
  }

  // Dubai 시계열: oilprice chart endpoint에서 가져온 1년치 사용
  const dByDate = dubaiHistMap;

  const history = sortedDates.map(iso => {
    const d = new Date(iso + "T00:00:00Z");
    return {
      date: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`,
      fullDate: iso,
      WTI:   wByDate.get(iso) ?? null,
      Brent: bByDate.get(iso) ?? null,
      Dubai: dByDate.get(iso) ?? null,
    };
  });

  return NextResponse.json({
    latest: {
      WTI:   wtiLatestVal,
      Brent: brentLatestVal,
      Dubai: dubaiLatest,
    },
    dubaiSource,
    history,
    updatedAt: new Date().toISOString(),
  });
}
