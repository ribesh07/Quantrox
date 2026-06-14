import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
     eslint: {
    ignoreDuringBuilds: true,
  },
    typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.settlerpay.com",
      },
      {
      protocol: "https",
      hostname: "**",
    },
    {
      protocol: "http",
      hostname: "**",
    },
    ],
  },
};

export default nextConfig;