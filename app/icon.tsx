import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: "#060e1a",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 5,
          height: 22,
          borderRadius: 3,
          background: "linear-gradient(180deg, #f97316, #38bdf8)",
        }}
      />
    </div>,
    { ...size }
  );
}
