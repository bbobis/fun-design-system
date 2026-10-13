import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...nx.configs['flat/react'],
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {},
  },
  {
    // Type-aware rules: ESLint asks TypeScript for the types (like your editor does),
    // so it can tell that e.g. `user.click()` returns a Promise.
    // https://typescript-eslint.io/getting-started/typed-linting
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // A Promise must be awaited, returned, .then/.catch-ed, or marked `void` on
      // purpose. A forgotten `await user.click()` makes a test check too early.
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  {
    ignores: ['**/out-tsc'],
  },
];
