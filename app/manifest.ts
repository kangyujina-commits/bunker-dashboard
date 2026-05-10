import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BunkerBoard",
    short_name: "BunkerBoard",
    description: "벙커유 & 원유 가격 대시보드 (Platts vs S&B)",
    start_url: "/",
    display: "standalone",
    background_color: "#060e1a",
    theme_color: "#060e1a",
    orientation: "portrait",
    icons: [
      { src: "/icon.png",       sizes: "32x32",   type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
