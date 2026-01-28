import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import security from "eslint-plugin-security";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Security plugin for detecting common security issues
  {
    plugins: {
      security,
    },
    rules: {
      // Detect potential XSS vulnerabilities
      "security/detect-object-injection": "warn",
      // Detect unsafe regex
      "security/detect-unsafe-regex": "error",
      // Detect use of eval
      "security/detect-eval-with-expression": "error",
      // Detect non-literal require
      "security/detect-non-literal-require": "warn",
      // Detect non-literal fs filename
      "security/detect-non-literal-fs-filename": "warn",
      // Detect possible timing attacks
      "security/detect-possible-timing-attacks": "warn",
      // Detect pseudoRandomBytes
      "security/detect-pseudoRandomBytes": "error",
      // Detect buffer noAssert
      "security/detect-buffer-noassert": "error",
      // Detect child process
      "security/detect-child-process": "warn",
      // Detect disable mustache escape
      "security/detect-disable-mustache-escape": "error",
      // Detect no csrf before method override
      "security/detect-no-csrf-before-method-override": "error",
      // Detect non literal regexp
      "security/detect-non-literal-regexp": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
