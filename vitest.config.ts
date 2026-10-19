import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest had NO config at all, which is why only the two leaf modules
 * (`_validate`, `rate-limit`) were testable: they import nothing, while
 * every real module reaches for the `@/…` alias and blew up with
 * "Cannot find package '@/lib/rate-limit'". The alias below mirrors
 * tsconfig.json's `paths` — keep the two in sync if the alias ever moves.
 *
 * Server-side unit tests only (node environment): the API routes, the admin
 * gate and the validation layer. Component/E2E coverage is a separate step.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});