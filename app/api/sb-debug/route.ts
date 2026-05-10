import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET() {
  const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
  try {
    const res = await fetch("https://shipandbunker.com/prices/apac/sea/sg-sin-singapore", {
      headers: { "User-Agent": UA, Accept: "text/html" },
      cache: "no-store",
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // 스크립트 태그 안에 JSON 데이터 있는지 확인
    const scripts: string[] = [];
    $("script").each((_, el) => {
      const src = $(el).attr("src");
      const content = $(el).html() ?? "";
      if (!src && (content.includes("price") || content.includes("vlsfo") || content.includes("380") || content.includes("bunker")) ) {
        scripts.push(content.slice(0, 500));
      }
    });

    // table 구조 추출
    const tables: string[] = [];
    $("table").each((_, el) => {
      tables.push($.html(el)?.slice(0, 1000) ?? "");
    });

    // VLSFO 주변 텍스트
    const bodyText = $("body").text().replace(/\s+/g, " ");
    const vIdx = bodyText.search(/vlsfo/i);
    const iIdx = bodyText.search(/ifo.?380/i);
    const lIdx = bodyText.search(/lsmgo|ls.?mgo/i);

    return NextResponse.json({
      status: res.status,
      htmlLength: html.length,
      scriptMatches: scripts.slice(0, 5),
      tableCount: tables.length,
      tables: tables.slice(0, 3),
      vlsfoContext: vIdx >= 0 ? bodyText.slice(Math.max(0, vIdx - 50), vIdx + 200) : "NOT FOUND",
      ifo380Context: iIdx >= 0 ? bodyText.slice(Math.max(0, iIdx - 50), iIdx + 200) : "NOT FOUND",
      lsmgoContext: lIdx >= 0 ? bodyText.slice(Math.max(0, lIdx - 50), lIdx + 200) : "NOT FOUND",
      // data-* 속성 있는 요소 샘플
      dataAttrs: (() => {
        const found: string[] = [];
        $("[data-price],[data-value],[data-bunker]").each((_, el) => {
          found.push($.html(el)?.slice(0, 200) ?? "");
        });
        return found.slice(0, 5);
      })(),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
