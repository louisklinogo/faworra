import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zvatkstmsyuytbajzuvn.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "zvatkstmsyuytbajzuvn.supabase.co",
        pathname: "/storage/v1/render/image/public/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  experimental: {
    // PPR disabled - requires Next.js canary, we're on stable 15.5.4
    // Will enable when PPR is stable in Next.js 16+
    // ppr: 'incremental',

    // Optimize package imports for smaller bundles
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "recharts",
      "framer-motion",
      "@tanstack/react-query",
    ],
  },

  async rewrites() {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    return [
      {
        source: "/api/trpc/:path*",
        destination: `${base}/trpc/:path*`,
      },
    ];
  },
};

export default nextConfig;
