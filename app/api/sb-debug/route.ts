import { NextResponse } from "next/server";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

// S&B 내부 API 후보 엔드포인트 탐색
const CANDIDATES = [
  "https://shipandbunker.com/api/v1/prices/apac/sea/sg-sin-singapore",
  "https://shipandbunker.com/api/prices/apac/sea/sg-sin-singapore",
  "https://shipandbunker.com/prices/apac/sea/sg-sin-singapore.json",
  "https://api.shipandbunker.com/prices/sg-sin",
  "https://shipandbunker.com/prices/apac/sea/sg-sin-singapore?format=json",
];

export async function GET() {
  const results: Record<string, unknown> = {};

  for (const url of CANDIDATES) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json, text/html" },
        cache: "no-store",
      });
      const text = await res.text();
      results[url] = {
        status: res.status,
        contentType: res.headers.get("content-type"),
        snippet: text.slice(0, 300),
        looksLikeJson: text.trim().startsWith("{") || text.trim().startsWith("["),
      };
    } catch (e) {
      results[url] = { error: String(e) };
    }
  }

  // 메인 페이지 HTML에서 script src 목록 수집 (JS 번들 URL 파악)
  let scriptSrcs: string[] = [];
  let title = "";
  let isCloudflare = false;
  let hasNextData = false;
  try {
    const res = await fetch("https://shipandbunker.com/prices/apac/sea/sg-sin-singapore", {
      headers: { "User-Agent": UA, Accept: "text/html" },
      cache: "no-store",
    });
    const html = await res.text();
    title = html.match(/<title[^>]*>([^<]+)/)?.[1] ?? "";
    isCloudflare = html.includes("cloudflare") || html.includes("cf-browser-verification");
    hasNextData = html.includes("__NEXT_DATA__");
    const srcs = [...html.matchAll(/src="([^"]*\.js[^"]*)"/g)].map(m => m[1]);
    scriptSrcs = srcs.filter(s => !s.includes("google") && !s.includes("analytics")).slice(0, 10);

    // __NEXT_DATA__ 추출 시도
    const nd = html.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)/);
    if (nd) {
      results["__NEXT_DATA__"] = nd[1].slice(0, 500);
    }
  } catch (e) {
    results["mainPageError"] = String(e);
  }

  return NextResponse.json({ title, isCloudflare, hasNextData, scriptSrcs, apiCandidates: results });
}
