import { ImageResponse } from "next/og";
import { COMMUNITY } from "@/lib/config";

/**
 * 180x180 apple-touch-icon — used by iOS when residents add the
 * portal to their home screen. Same look as app/icon.tsx; iOS just
 * prefers this exact size.
 */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 100,
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
