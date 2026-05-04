import { ImageResponse } from "next/og";
import { COMMUNITY } from "@/lib/config";

/**
 * 192x192 brand-colored PWA icon, generated at build time from
 * COMMUNITY.primaryColor + the community's initial. Replace with a
 * real per-community PNG by adding `public/icon.png` and deleting
 * this file when the community provides a logo.
 */

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: COMMUNITY.primaryColor,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 110,
          fontWeight: 700,
          letterSpacing: "-0.04em",
        }}
      >
        {(COMMUNITY.name[0] ?? "C").toUpperCase()}
      </div>
    ),
    { ...size }
  );
}
