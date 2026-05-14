import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

interface Source {
  name: string;
  url: string;
  color: string;
  icon: string;
}

const SOURCES: Source[] = [
  { name: "Ship & Bunker",     url: "https://feeds.feedburner.com/shipandbunker",            color: "#f97316", icon: "⚓" },
  { name: "gCaptain",          url: "https://gcaptain.com/feed/",                            color: "#38bdf8", icon: "🚢" },
  { name: "Hellenic Shipping", url: "https://www.hellenicshippingnews.com/feed/",            color: "#a3e635", icon: "🌊" },
  { name: "Splash247",         url: "https://splash247.com/feed/",                           color: "#c084fc", icon: "💧" },
  { name: "Offshore Energy",   url: "https://www.offshore-energy.biz/feed/",                 color: "#fb7185", icon: "🛢" },
];

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;    // ISO
  source: string;
  color: string;
  icon: string;
  summary?: string;
}

function parseRSS(xml: string, src: Source): NewsItem[] {
  const $ = cheerio.load(xml, { xmlMode: true });
  const items: NewsItem[] = [];

  // Standard RSS 2.0 <item>
  $("item").each((_, el) => {
    const title = $(el).find("title").first().text().trim();
    const link  = $(el).find("link").first().text().trim();
    const pub   = $(el).find("pubDate").first().text().trim();
    const desc  = $(el).find("description").first().text().trim();
    if (!title || !link) return;
    const date = pub ? new Date(pub) : new Date();
    items.push({
      title,
      link,
      pubDate: isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString(),
      source: src.name,
      color: src.color,
      icon: src.icon,
      summary: desc ? cheerio.load(desc).text().slice(0, 180).trim() : undefined,
    });
  });

  // Atom <entry> fallback
  if (items.length === 0) {
    $("entry").each((_, el) => {
      const title = $(el).find("title").first().text().trim();
      const link  = $(el).find("link").first().attr("href") ?? "";
      const pub   = $(el).find("updated, published").first().text().trim();
      if (!title || !link) return;
      const date = pub ? new Date(pub) : new Date();
      items.push({
        title, link,
        pubDate: isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString(),
        source: src.name, color: src.color, icon: src.icon,
      });
    });
  }

  return items;
}

async function fetchSource(src: Source): Promise<{ items: NewsItem[]; error?: string }> {
  try {
    const res = await fetch(src.url, {
      headers: { "User-Agent": UA, Accept: "application/rss+xml,application/xml,text/xml,*/*" },
      next: { revalidate: 1800 }, // 30분 캐시
    });
    if (!res.ok) return { items: [], error: `${src.name}: HTTP ${res.status}` };
    const xml = await res.text();
    return { items: parseRSS(xml, src) };
  } catch (e) {
    return { items: [], error: `${src.name}: ${String(e)}` };
  }
}

export async function GET() {
  const results = await Promise.all(SOURCES.map(fetchSource));
  const all: NewsItem[] = [];
  const errors: string[] = [];
  results.forEach(({ items, error }) => {
    all.push(...items);
    if (error) errors.push(error);
  });

  // 최신순 정렬, 최대 60개
  all.sort((a, b) => (a.pubDate < b.pubDate ? 1 : -1));
  const items = all.slice(0, 60);

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    count: items.length,
    sources: SOURCES.map(s => ({ name: s.name, color: s.color, icon: s.icon })),
    items,
    errors,
  });
}
