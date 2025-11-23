import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.dzine.ai',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'api.a2e.ai',
      },
      {
        protocol: 'https',
        hostname: '7days-apac.ai2everyone.com',
      },
      {
        protocol: 'https',
        hostname: 'video.a2e.ai',
      },
    ],
  },
};

export default nextConfig;
