import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
    coverage: {
    exclude: ["src/lib/logging.ts", "src/lib/session.ts", "src/generated/**"],},
  },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
})
