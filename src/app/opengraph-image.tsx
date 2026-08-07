import { ImageResponse } from "next/og";

export const alt = "Phonq — the free home of phonk";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          background: "#181020",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 128,
            height: 128,
            borderRadius: 32,
            background: "#9d67e9",
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "flex-end", height: 72 }}>
            <div style={{ width: 16, height: 36, borderRadius: 8, background: "#ffffff" }} />
            <div style={{ width: 16, height: 72, borderRadius: 8, background: "#ffffff" }} />
            <div style={{ width: 16, height: 52, borderRadius: 8, background: "#ffffff" }} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -2, color: "#f4f1fa" }}>Phonq</div>
          <div style={{ fontSize: 32, color: "#b9a8d6" }}>The free home of phonk</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
