import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence the multi-lockfile warning by pinning the workspace root
  // to this repo. Without this, Next picks ~/package-lock.json on this
  // machine and complains.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
