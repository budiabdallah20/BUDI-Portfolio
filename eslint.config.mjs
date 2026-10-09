/**
 * NOTE: `eslint-config-next` cannot load in this workspace because its bundled
 * `typescript-eslint` hard-throws on TypeScript >= 7 (see TS 7 announcement:
 * typescript-eslint#10940). Downgrading TypeScript is not an option, so this
 * config lints plain JS with core rules only. TypeScript/TSX correctness is
 * enforced by `npm run typecheck` (tsc --noEmit) and `npm run build`.
 */
export default [
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module" },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-eval": "error",
    },
  },
];
