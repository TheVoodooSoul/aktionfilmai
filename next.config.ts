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
        hostname: '3days-apac.ai2everyone.com',
      },
      {
        protocol: 'https',
        hostname: '*.ai2everyone.com',
      },
      {
        protocol: 'https',
        hostname: 'video.a2e.ai',
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
      },
      {
        protocol: 'https',
        hostname: '*.replicate.delivery',
      },
      {
        protocol: 'https',
        hostname: 'fal.media',
      },
      {
        protocol: 'https',
        hostname: '*.fal.media',
      },
      {
        protocol: 'https',
        hostname: 'modelslab-bom.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.modelslab.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-*.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.rtst.ai',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
    ],
  },
};

export default nextConfig;
