import { NextResponse } from "next/server";

export async function GET() {
  const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
  try {
    const res = await fetch("https://shipandbunker.com/prices/apac/sea/sg-sin-singapore", {
      headers: { "User-Agent": UA, Accept: "text/html" },
      cache: "no-store",
    });
    const html = await res.text();
    // 가격 관련 섹션만 추출
    const priceIdx = html.search(/vlsfo|ifo.?380|lsmgo|ls.?mgo|bunker.?price/i);
    const start = Math.max(0, priceIdx - 200);
    return NextResponse.json({
      status: res.status,
      totalLength: html.length,
      priceIdx,
      snippet: html.slice(start, start + 6000),
      tail: html.slice(-3000),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
