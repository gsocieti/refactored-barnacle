import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  // Default 1MB terlalu kecil untuk unggah foto/CSV lewat Server Action.
  experimental: { serverActions: { bodySizeLimit: '4mb' } },
};
export default nextConfig;
