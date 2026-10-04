import { ImageResponse } from "next/og";

export const alt = "thedesignvibe — find the ones you came to meet, before the doors open.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#0a090d",
          backgroundImage:
            "radial-gradient(900px 540px at 8% -10%, rgba(255,92,56,0.20), transparent 62%), radial-gradient(700px 460px at 100% 6%, rgba(107,92,255,0.16), transparent 60%)",
          color: "#f6f3ee",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26, letterSpacing: 1 }}>
          <div style={{ width: 13, height: 13, borderRadius: 999, background: "#ff5c38" }} />
          <span style={{ color: "#9c95a9" }}>THEDESIGNVIBE</span>
          <span style={{ color: "#3a3646" }}>/</span>
          <span style={{ color: "#9c95a9" }}>CONFIG INDIA 2026</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 68, lineHeight: 1.08, letterSpacing: -1.6, maxWidth: 980 }}>
            India’s first Config. One day. Don’t spend it walking past the people you came to
            meet.
          </div>
          <div style={{ fontSize: 30, color: "#9c95a9" }}>
            Find the ones you came to meet, before the doors open.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", fontSize: 22, color: "#6a6478" }}>
            BIEC, Bengaluru · 15 October 2026 · No phone number. Ever.
          </div>
          {/* The share card travels further than the site, so it says this too. */}
          <div style={{ display: "flex", fontSize: 18, color: "#5f5973" }}>
            Independent and unofficial. Not affiliated with or endorsed by Figma.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
