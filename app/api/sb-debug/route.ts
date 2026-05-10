import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

export async function GET() {
  const res = await fetch("https://shipandbunker.com/prices/apac/sea/sg-sin-singapore", {
    headers: { "User-Agent": UA, Accept: "text/html", "Accept-Language": "en-US,en;q=0.9" },
    cache: "no-store",
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  // 200~2000 범위 숫자 (연료가격) 주변 HTML 추출
  const allText = $("body").html() ?? "";
  const pricePattern = /([2-9]\d{2}(\.\d+)?)/g;
  const priceMatches: Array<{ value: string; context: string }> = [];
  let m: RegExpExecArray | null;
  let count = 0;
  while ((m = pricePattern.exec(allText)) !== null && count < 20) {
    const start = Math.max(0, m.index - 80);
    const end = Math.min(allText.length, m.index + 80);
    priceMatches.push({ value: m[1], context: allText.slice(start, end).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ") });
    count++;
  }

  // table 구조
  const tables: string[] = [];
  $("table").each((_, el) => {
    tables.push(($(el).text().replace(/\s+/g, " ")).slice(0, 300));
  });

  // class에 price/bunker/fuel 있는 요소
  const priceEls: string[] = [];
  $("[class*=price],[class*=bunker],[class*=fuel],[class*=grade]").each((_, el) => {
    priceEls.push($(el).text().trim().slice(0, 100));
  });

  return NextResponse.json({
    status: res.status,
    htmlLength: html.length,
    tableCount: tables.length,
    tables: tables.slice(0, 5),
    priceRangeMatches: priceMatches.slice(0, 10),
    priceClassElements: [...new Set(priceEls)].slice(0, 10),
    // 원시 HTML에서 VLSFO 주변 200자
    rawVlsfo: (() => {
      const i = html.toLowerCase().indexOf("vlsfo");
      return i >= 0 ? html.slice(Math.max(0, i - 100), i + 300) : "NOT IN HTML";
    })(),
  });
}
