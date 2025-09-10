import { withContentlayer } from "next-contentlayer";

const nextConfig = {
  experimental: { optimizePackageImports: ["lucide-react"] },
  eslint: { ignoreDuringBuilds: true },
};

export default withContentlayer(nextConfig);
