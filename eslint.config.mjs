import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated typings from ABI generation.
    "src/abi/**/artifacts.d.ts",
    // Generated subgraph typings.
    "subgraph/generated/**",
    // V3 indexer is a standalone AssemblyScript package with its own build pipeline.
    "subgraph-v3/**",
    // Utility scripts are not part of runtime frontend bundle.
    "scripts/**",
  ]),
]);

export default eslintConfig;
