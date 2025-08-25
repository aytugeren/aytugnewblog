import { withContentlayer } from "next-contentlayer";

const nextConfig = {
  experimental: { optimizePackageImports: ["lucide-react"] },
};

export default withContentlayer(nextConfig);
