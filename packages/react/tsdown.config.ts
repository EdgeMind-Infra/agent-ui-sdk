import path from "node:path";
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  hash: false,
  clean: true,
  sourcemap: true,
  alias: {
    src: path.resolve(import.meta.dirname, "src"),
  },
});
