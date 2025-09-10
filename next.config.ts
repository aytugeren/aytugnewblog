import { withContentlayer } from "next-contentlayer2";

const nextConfig = {
  experimental: { optimizePackageImports: ["lucide-react"] },
  eslint: { ignoreDuringBuilds: true },
};

export default withContentlayer(nextConfig);
