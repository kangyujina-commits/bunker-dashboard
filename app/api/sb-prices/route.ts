import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

const PORTS: Record<string, string> = {
  Singapore:       "https://shipandbunker.com/prices/apac/sea/sg-sin-singapore",
  Fujairah:        "https://shipandbunker.com/prices/emea/me/ae-fjr-fujairah",
  Rotterdam:       "https://shipandbunker.com/prices/emea/nwe/nl-rtm-rotterdam",
  "Hong Kong":     "https://shipandbunker.com/prices/apac/ea/hk-hkg-hong-kong",
  "LA/Long Beach": "https://shipandbunker.com/prices/am/ws/us-lax-los-angeles",
};

const MAIN_PAGE = "https://shipandbunker.com/prices";

function extractPrice(text: string): number | null {
  const m = text.replace(/,/g, "").match(/\d{3,4}(\.\d+)?/);
  if (!m) return null;
  const v = parseFloat(m[0]);
  return v > 50 && v < 5000 ? v : null;
}

// 2026-05 기준 selector:
// S&B 페이지는 등급별로 h3 "Latest Prices, X" 헤딩 + 바로 뒤 table 구조.
// 테이블 행: th(날짜) | td(가격) | td(변동) | td(고) | td(저) | td(스프레드)
// → 첫 번째 데이터 행의 첫 번째 td가 현재가격.
function parsePrices(html: string): Record<string, number | null> {
  const $ = cheerio.load(html);
  const result: Record<string, number | null> = { VLSFO: null, IFO380: null, LSMGO: null };

  $("h3").each((_, h3el) => {
    const heading = $(h3el).text().trim();
    if (!heading.startsWith("Latest Prices")) return;

    // 등급 판별
    let grade: string | null = null;
    if (/VLSFO/i.test(heading))         grade = "VLSFO";
    else if (/IFO380|IFO 380/i.test(heading)) grade = "IFO380";
    else if (/LSMGO|LS MGO/i.test(heading))   grade = "LSMGO";
    if (!grade || result[grade] !== null) return;

    // h3 이후 첫 번째 <table> 형제 탐색
    let sib = $(h3el).next();
    for (let i = 0; i < 6; i++) {
      if (!sib.length) break;
      if (sib.is("table")) {
        // 첫 번째 데이터 행(header 다음 행)의 첫 td = 가격
        const firstTd = sib.find("tr").eq(1).find("td").first().text().trim();
        const price = extractPrice(firstTd);
        if (price !== null) result[grade] = price;
        return;
      }
      sib = sib.next();
    }
  });

  return result;
}

async function fetchPort(portName: string, url: string, noStore: boolean): Promise<{ portName: string; prices: Record<string, number | null>; error?: string }> {
  const NULL_PRICES = { VLSFO: null, IFO380: null, LSMGO: null };
  try {
    let res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      ...(noStore ? { cache: "no-store" } : { next: { revalidate: 3600 } }),
    });

    // URL이 틀렸으면 메인 페이지에서 링크 재탐색
    if (!res.ok) {
      const mainRes = await fetch(MAIN_PAGE, { headers: { "User-Agent": UA }, cache: "no-store" });
      if (mainRes.ok) {
        const $$ = cheerio.load(await mainRes.text());
        const needle = portName.toLowerCase().replace(/[\s/]/g, "");
        let found = "";
        $$("a[href*='/prices/']").each((_, a) => {
          const href = $$(a).attr("href") ?? "";
          if (href.toLowerCase().replace(/[\s/-]/g, "").includes(needle)) { found = href; return false; }
        });
        if (found) {
          const fullUrl = found.startsWith("http") ? found : `https://shipandbunker.com${found}`;
          res = await fetch(fullUrl, { headers: { "User-Agent": UA }, cache: "no-store" });
        }
      }
    }

    if (!res.ok) return { portName, prices: NULL_PRICES, error: `HTTP ${res.status}` };
    return { portName, prices: parsePrices(await res.text()) };
  } catch (e) {
    return { portName, prices: NULL_PRICES, error: String(e) };
  }
}

export async function GET(request: Request) {
  const noStore = request.headers.get("cache-control") === "no-store";
  try {
    const results = await Promise.all(
      Object.entries(PORTS).map(([name, url]) => fetchPort(name, url, noStore))
    );

    const ports: Record<string, Record<string, number | null>> = {};
    const errors: string[] = [];
    for (const { portName, prices, error } of results) {
      ports[portName] = prices;
      if (error) errors.push(`${portName}: ${error}`);
    }

    return NextResponse.json({ updatedAt: new Date().toISOString(), ports, errors });
  } catch (e) {
    return NextResponse.json({ error: "S&B 가격 조회 실패", detail: String(e) }, { status: 500 });
  }
}
