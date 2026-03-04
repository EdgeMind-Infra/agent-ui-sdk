import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/react/index.ts", "src/ai-sdk/index.ts"],
  format: ["esm", "cjs"],
  dts: false,
  hash: false,
  clean: true,
  sourcemap: true,
});
