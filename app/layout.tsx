import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#060e1a",
};

export const metadata: Metadata = {
  title: "BunkerBoard",
  description: "벙커유 & 원유 가격 대시보드 (Platts vs Ship & Bunker 비교)",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BunkerBoard",
  },
  formatDetection: { telephone: false },
};

// React hydration 이전에 theme 적용 — 깜빡임(FOUC) 방지
const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('bb_theme') || 'dark';
    document.documentElement.dataset.theme = t;
  } catch (e) {
    document.documentElement.dataset.theme = 'dark';
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-theme="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
