import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/pixel-quest",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
