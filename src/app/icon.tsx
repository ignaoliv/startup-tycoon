import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#5b5bd6", fontSize: 44, borderRadius: 14 }}>🚀</div>
    ),
    { ...size, emoji: "noto" },
  );
}
