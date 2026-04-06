// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";
import nextConfig from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextConfig,
  ...nextTypescript,
  {
    rules: {
      // Underscore-prefixed variables are intentionally unused (e.g. destructured
      // to prevent spreading non-HTML props; named params in overrides).
      '@typescript-eslint/no-unused-vars': ['warn', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
      }],
      // react-hooks v7 added stricter rules that produce false positives in this
      // codebase. error-boundaries: Greeting.tsx uses try/catch for data fetching
      // in a server component, not for catching render errors — valid pattern.
      // react-in-effects: setState inside useEffect is standard React idiom for
      // deriving state from props after a fetch; the rule is overly broad here.
      'react-hooks/error-boundaries': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "storybook-static/**",
      "test-results/**",
      "playwright-report/**",
      "next-env.d.ts",
      ".claude/**"
    ]
  },
  ...storybook.configs["flat/recommended"]
];

export default eslintConfig;
