import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BunkerBoard — Marine Fuel & Crude",
  description: "벙커유 & 원유 가격 대시보드 (Platts vs Ship & Bunker 비교)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
