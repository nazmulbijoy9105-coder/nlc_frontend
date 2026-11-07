import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);
import next from 'eslint-config-next';

export default [
  ...next,
  { ignores: ['node_modules/', '.next/', 'out/'] },
];
