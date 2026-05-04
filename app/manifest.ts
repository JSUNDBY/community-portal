import type { MetadataRoute } from "next";
import { COMMUNITY } from "@/lib/config";

/**
 * PWA manifest. Per spec, residents can install the portal to their
 * home screen instead of needing a native app. Icons are generated on
 * the fly by app/icon.tsx + app/apple-icon.tsx so they always match
 * the deployed community's brand color.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${COMMUNITY.name} Portal`,
    short_name: COMMUNITY.name,
    description: `Resident portal for ${COMMUNITY.name}.`,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: COMMUNITY.primaryColor,
    icons: [
      { src: "/icon", sizes: "192x192", type: "image/png" },
      { src: "/icon", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "192x192", type: "image/png", purpose: "maskable" },
    ],
  };
}
