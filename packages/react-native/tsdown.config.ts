import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  hash: false,
  clean: true,
  sourcemap: true,
  external: ["react", "react-native", "@ai-sdk/react"],
});
