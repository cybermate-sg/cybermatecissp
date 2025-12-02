import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Some environments (like Codacy's ESLint engine) don't have `eslint-config-next`
// installed, which makes `next/core-web-vitals` and `next/typescript` unavailable
// and causes a hard failure: "Failed to load config \"next/core-web-vitals\"".
//
// To avoid breaking lint runs in those environments, we try to extend the Next.js
// configs and gracefully fall back to a minimal config if they cannot be resolved.
let baseConfigs = [];

try {
  baseConfigs = compat.extends("next/core-web-vitals", "next/typescript");
} catch (error) {
  // eslint-disable-next-line no-console -- This only runs during config load
  console.warn(
    "[eslint.config.mjs] Could not load 'next/core-web-vitals' or 'next/typescript'. " +
      "Falling back to a minimal ESLint config. Original error:",
    error?.message ?? error,
  );
  baseConfigs = [];
}

const eslintConfig = [
  ...baseConfigs,
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        // Node.js globals
        __dirname: "readonly",
        __filename: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        process: "readonly",
        console: "readonly",
      },
    },
    rules: {
      // Disable false positive warnings flagged by Codacy
      // Template literals are valid ES6+ syntax and widely used in modern JavaScript
      "no-template-curly-in-string": "off",

      // Trailing commas are a best practice for better git diffs
      // and are valid JavaScript syntax since ES5
      "comma-dangle": ["off"],
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
