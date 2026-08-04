import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for highlighting potential issues
  reactStrictMode: true,

  // Experimental features for Next.js 15
  experimental: {
    // Optimise package imports to reduce bundle size
    optimizePackageImports: ["lucide-react", "recharts", "@radix-ui/react-icons"],
  },

  // Images: allow external domains as needed
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
