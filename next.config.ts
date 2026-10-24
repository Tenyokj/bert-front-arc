import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.BERT_E2E === "1" ? {
    distDir: ".next-e2e",
    typescript: { tsconfigPath: ".e2e-results/tsconfig.json" },
  } : {}),
};

export default nextConfig;
