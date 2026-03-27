import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow streaming responses
  serverExternalPackages: ["@anthropic-ai/sdk"],
};

export default nextConfig;
