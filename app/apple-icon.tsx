import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        background: "#060e1a",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      }}
    >
      {/* 그라데이션 바 */}
      <div
        style={{
          width: 10,
          height: 68,
          borderRadius: 5,
          background: "linear-gradient(180deg, #f97316, #38bdf8)",
        }}
      />
      {/* 텍스트 */}
      <div
        style={{
          color: "#f8fafc",
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: -1,
          fontFamily: "sans-serif",
        }}
      >
        BB
      </div>
    </div>,
    { ...size }
  );
}
