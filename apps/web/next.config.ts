import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  transpilePackages: ["@crystal/ui", "@crystal/db", "@crystal/ai"],
};

export default config;
