import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Next 16.4 adds compiler-oriented checks to existing code. Keep them visible
    // without coupling the security update to transaction/clock state refactors.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
    },
  },
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
