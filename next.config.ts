import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Increase body size limit for audio uploads (default is ~4MB)
  // This allows 30-60 second audio recordings to be uploaded
  serverActions: {
    bodySizeLimit: '25mb',
  },
};

export default nextConfig;
