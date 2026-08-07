import { defineConfig } from "vitest/config";

const rootDir = import.meta.dirname;

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
    clearMocks: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      "@": `${rootDir}/src`,
      // Next.js stubs these at the compiler level; bare Node (vitest) can't
      // resolve them, so point them at a no-op module.
      "server-only": `${rootDir}/test/empty-module.ts`,
      "client-only": `${rootDir}/test/empty-module.ts`,
    },
  },
});
