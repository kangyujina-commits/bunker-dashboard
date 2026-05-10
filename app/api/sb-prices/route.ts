import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

// 2026-05 기준 selector — S&B가 페이지 구조 바꾸면 여기 수정
const GRADE_ALIASES: Record<string, string[]> = {
  VLSFO:  ["VLSFO", "0.5%", "Max 0.5"],
  IFO380: ["IFO 380", "IFO380", "3.5%", "Max 3.5", "HSFO"],
  LSMGO:  ["LS MGO", "LSMGO", "0.1%", "Max 0.1", "Distillate"],
};

const PORTS: Record<string, string> = {
  Singapore:     "https://shipandbunker.com/prices/apac/sea/sg-sin-singapore",
  Fujairah:      "https://shipandbunker.com/prices/emea/me/ae-fjr-fujairah",
  Rotterdam:     "https://shipandbunker.com/prices/emea/nwe/nl-rtm-rotterdam",
  "Hong Kong":   "https://shipandbunker.com/prices/apac/ea/hk-hkg-hong-kong",
  "LA/Long Beach": "https://shipandbunker.com/prices/am/ws/us-lax-los-angeles",
};

const MAIN_PAGE = "https://shipandbunker.com/prices";

function matchesGrade(text: string, aliases: string[]): boolean {
  const t = text.toLowerCase().trim();
  return aliases.some((a) => t.includes(a.toLowerCase()));
}

function extractPrice(text: string): number | null {
  const m = text.replace(/,/g, "").match(/\d{2,4}(\.\d+)?/);
  if (!m) return null;
  const v = parseFloat(m[0]);
  return v > 50 && v < 5000 ? v : null;
}

function parsePrices(html: string): Record<string, number | null> {
  const $ = cheerio.load(html);
  const result: Record<string, number | null> = { VLSFO: null, IFO380: null, LSMGO: null };

  // 전략 1: <table> 행에서 등급명 + 가격 파싱 (2026-05 기준 selector)
  $("table tr").each((_, row) => {
    const cells = $(row).find("td, th");
    if (cells.length < 2) return;
    const firstCell = $(cells[0]).text();
    const priceCell = $(cells[1]).text();
    for (const [grade, aliases] of Object.entries(GRADE_ALIASES)) {
      if (result[grade] === null && matchesGrade(firstCell, aliases)) {
        result[grade] = extractPrice(priceCell);
      }
    }
  });

  // 전략 2: class에 "price"를 포함하는 요소 주변에서 등급명 찾기 (2026-05 기준 selector)
  if (Object.values(result).every((v) => v === null)) {
    $("[class*='price'], [class*='grade'], [class*='fuel']").each((_, el) => {
      const parent = $(el).closest("li, div, article, section");
      const text = parent.text();
      for (const [grade, aliases] of Object.entries(GRADE_ALIASES)) {
        if (result[grade] === null && matchesGrade(text, aliases)) {
          const nums = text.replace(/,/g, "").match(/\d{3}(\.\d+)?/g);
          if (nums) {
            for (const n of nums) {
              const v = parseFloat(n);
              if (v > 50 && v < 5000) { result[grade] = v; break; }
            }
          }
        }
      }
    });
  }

  // 전략 3: regex 풀백 — 등급 텍스트 근처 숫자 (2026-05 기준 selector)
  if (Object.values(result).every((v) => v === null)) {
    const raw = $("body").text();
    for (const [grade, aliases] of Object.entries(GRADE_ALIASES)) {
      for (const alias of aliases) {
        const re = new RegExp(alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\\s\\S]{0,60}?(\\d{3,4}(?:\\.\\d+)?)", "i");
        const m = raw.match(re);
        if (m) { result[grade] = extractPrice(m[1]); break; }
      }
    }
  }

  return result;
}

async function fetchPortUrl(portName: string, url: string): Promise<{ portName: string; prices: Record<string, number | null>; error?: string }> {
  try {
    let res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      next: { revalidate: 3600 },
    });

    // fallback: URL이 틀렸으면 메인 페이지에서 링크 다시 찾기
    if (!res.ok) {
      const mainRes = await fetch(MAIN_PAGE, {
        headers: { "User-Agent": UA, Accept: "text/html" },
        cache: "no-store",
      });
      if (mainRes.ok) {
        const mainHtml = await mainRes.text();
        const $$ = cheerio.load(mainHtml);
        const needle = portName.toLowerCase().replace("/", "").replace(" ", "");
        let foundUrl = "";
        $$("a[href*='/prices/']").each((_, a) => {
          const href = $$(a).attr("href") ?? "";
          if (href.toLowerCase().includes(needle)) { foundUrl = href; return false; }
        });
        if (foundUrl) {
          const base = foundUrl.startsWith("http") ? foundUrl : `https://shipandbunker.com${foundUrl}`;
          res = await fetch(base, { headers: { "User-Agent": UA, Accept: "text/html" }, next: { revalidate: 3600 } });
        }
      }
    }

    if (!res.ok) return { portName, prices: { VLSFO: null, IFO380: null, LSMGO: null }, error: `HTTP ${res.status}` };

    const html = await res.text();
    return { portName, prices: parsePrices(html) };
  } catch (err) {
    return { portName, prices: { VLSFO: null, IFO380: null, LSMGO: null }, error: String(err) };
  }
}

export async function GET(request: Request) {
  const noStore = request.headers.get("cache-control") === "no-store";

  try {
    const results = await Promise.all(
      Object.entries(PORTS).map(([name, url]) =>
        noStore
          ? fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" }, cache: "no-store" })
              .then(async (r) => ({ portName: name, prices: r.ok ? parsePrices(await r.text()) : { VLSFO: null, IFO380: null, LSMGO: null }, error: r.ok ? undefined : `HTTP ${r.status}` }))
              .catch((e) => ({ portName: name, prices: { VLSFO: null, IFO380: null, LSMGO: null }, error: String(e) }))
          : fetchPortUrl(name, url)
      )
    );

    const ports: Record<string, Record<string, number | null>> = {};
    const errors: string[] = [];

    for (const { portName, prices, error } of results) {
      ports[portName] = prices;
      if (error) errors.push(`${portName}: ${error}`);
    }

    return NextResponse.json({ updatedAt: new Date().toISOString(), ports, errors });
  } catch (err) {
    return NextResponse.json({ error: "S&B 가격 조회 실패", detail: String(err) }, { status: 500 });
  }
}
