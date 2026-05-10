import { NextResponse } from "next/server";

export async function GET() {
  const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
  try {
    const res = await fetch("https://shipandbunker.com/prices/apac/sea/sg-sin-singapore", {
      headers: { "User-Agent": UA, Accept: "text/html" },
      cache: "no-store",
    });
    const html = await res.text();
    // 처음 8000자만 반환 (충분히 구조 파악 가능)
    return NextResponse.json({ status: res.status, snippet: html.slice(0, 8000) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
