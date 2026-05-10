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

function parseDateISO(dateStr: string): string | null {
  // "May 9, 2025" or "May 9" → "2025-05-09"
  const withYear = dateStr.includes(",")
    ? dateStr
    : `${dateStr}, ${new Date().getFullYear()}`;
  const d = new Date(withYear);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export interface SBEntry {
  date: string;
  dateISO: string;
  price: number;
}

type GradeKey = "VLSFO" | "IFO380" | "LSMGO";

// Table row structure per S&B page:
// th(날짜) | td(가격) | td(변동) | td(고) | td(저) | td(스프레드)
function parsePortData(html: string): Record<GradeKey, SBEntry[]> {
  const $ = cheerio.load(html);
  const result: Record<GradeKey, SBEntry[]> = { VLSFO: [], IFO380: [], LSMGO: [] };

  $("h3").each((_, h3el) => {
    const heading = $(h3el).text().trim();
    if (!heading.startsWith("Latest Prices")) return;

    let grade: GradeKey | null = null;
    if (/VLSFO/i.test(heading))               grade = "VLSFO";
    else if (/IFO380|IFO 380/i.test(heading)) grade = "IFO380";
    else if (/LSMGO|LS MGO/i.test(heading))   grade = "LSMGO";
    if (!grade || result[grade].length > 0) return;

    let sib = $(h3el).next();
    for (let i = 0; i < 6; i++) {
      if (!sib.length) break;
      if (sib.is("table")) {
        // Parse all data rows (skip header row at index 0). S&B 페이지는 보통 ~11일치 제공.
        sib.find("tr").slice(1).each((_, tr) => {
          const dateText = $(tr).find("th").first().text().trim();
          const priceText = $(tr).find("td").first().text().trim();
          const price = extractPrice(priceText);
          const dateISO = parseDateISO(dateText);
          if (price !== null && dateISO) {
            result[grade!].push({ date: dateText, dateISO, price });
          }
        });
        return;
      }
      sib = sib.next();
    }
  });

  return result;
}

async function fetchPort(
  portName: string,
  url: string,
  noStore: boolean
): Promise<{ portName: string; grades: Record<GradeKey, SBEntry[]>; error?: string }> {
  const EMPTY: Record<GradeKey, SBEntry[]> = { VLSFO: [], IFO380: [], LSMGO: [] };
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
          if (href.toLowerCase().replace(/[\s/-]/g, "").includes(needle)) {
            found = href;
            return false;
          }
        });
        if (found) {
          const fullUrl = found.startsWith("http") ? found : `https://shipandbunker.com${found}`;
          res = await fetch(fullUrl, { headers: { "User-Agent": UA }, cache: "no-store" });
        }
      }
    }

    if (!res.ok) return { portName, grades: EMPTY, error: `HTTP ${res.status}` };
    return { portName, grades: parsePortData(await res.text()) };
  } catch (e) {
    return { portName, grades: EMPTY, error: String(e) };
  }
}

export async function GET(request: Request) {
  const noStore = request.headers.get("cache-control") === "no-store";
  try {
    const results = await Promise.all(
      Object.entries(PORTS).map(([name, url]) => fetchPort(name, url, noStore))
    );

    const ports: Record<string, Record<GradeKey, SBEntry[]>> = {};
    const errors: string[] = [];
    for (const { portName, grades, error } of results) {
      ports[portName] = grades;
      if (error) errors.push(`${portName}: ${error}`);
    }

    return NextResponse.json({ updatedAt: new Date().toISOString(), ports, errors });
  } catch (e) {
    return NextResponse.json({ error: "S&B 가격 조회 실패", detail: String(e) }, { status: 500 });
  }
}
