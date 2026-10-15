import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Chettiyar Chekku Oil — 100% Vagai Wood Pressed Marachekku Oils";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#1C110A",
          color: "#FAF6F0",
          padding: "64px",
          border: "12px solid #D97706",
          fontFamily: "serif",
        }}
      >
        {/* Top Heritage Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              backgroundColor: "#2A1810",
              border: "2px solid #D97706",
              color: "#FBBF24",
              padding: "10px 24px",
              borderRadius: "999px",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "2px",
            }}
          >
            VANNIYA CHETTIYAR HERITAGE • 100% VAGAI WOOD PRESSED
          </div>
          <div
            style={{
              backgroundColor: "#1F4E3D",
              color: "#FAF6F0",
              padding: "10px 24px",
              borderRadius: "999px",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            0% Hexane • Lab Tested
          </div>
        </div>

        {/* Center Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div
            style={{
              fontSize: 74,
              fontWeight: 800,
              lineHeight: 1.08,
              color: "#FAF6F0",
            }}
          >
            Chettiyar Chekku Oil
          </div>
          <div
            style={{
              fontSize: 38,
              color: "#D97706",
              fontStyle: "italic",
            }}
          >
            Pressed at 14 RPM in Aged Vagai Wood. Clarified by the Sun.
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#E5D5C5",
              maxWidth: "920px",
              lineHeight: 1.4,
            }}
          >
            Karupatti Nallenai • Tiruvannamalai Groundnut • Pollachi White Copra
            Coconut • Sacred Pancha Deepam Oil
          </div>
        </div>

        {/* Bottom Trust Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "2px solid rgba(217, 119, 6, 0.35)",
            paddingTop: "24px",
            fontSize: 22,
            color: "#FBBF24",
            fontWeight: 600,
          }}
        >
          <span>14 RPM Slow Crush</span>
          <span>•</span>
          <span>Below 40°C Ambient Temp</span>
          <span>•</span>
          <span>48-Hr Sunlight Settled</span>
          <span>•</span>
          <span>Free Brass Pourer on 5L Tins</span>
        </div>
      </div>
    ),
    { ...size }
  );
}