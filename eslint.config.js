import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'old', 'node_modules', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { projectService: true },
    },
    rules: {
      "curly": ["error", "all"]
    },
  },
  {
    files: ['src/tests/**', 'src/**/*.test.{ts,tsx}'],
    rules: {
      // The tests read recordings, saved games and logs as JSON, which has no type.
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      // They rethrow whatever a handler on the page threw, which need not be an Error.
      '@typescript-eslint/only-throw-error': 'off',
      // React's act() is given an async callback so that it waits; the callback has nothing to await.
      '@typescript-eslint/require-await': 'off',
      // The replay borrows the browser's own setter for an input's value and calls it with call().
      '@typescript-eslint/unbound-method': 'off',
      // A canvas fill style can be a gradient; the tests print it and only ever set colours.
      '@typescript-eslint/no-base-to-string': 'off',
    },
  },
  {
    files: ['src/game/**/*.ts'],
    ignores: ['src/game/session.ts', 'src/game/session.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '(^|/)session\\.ts$',
              message:
                'The rules must not know the session: it imports them, so this makes an import cycle. Call game.changed() to redraw the page, and take anything else as an argument.',
            },
          ],
        },
      ],
    },
  },
  {
    // Plain scripts: the build tooling runs in Node, the service worker in its own scope.
    files: ['**/*.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      // The offline check also passes functions to a browser page.
      globals: { ...globals.node, ...globals.serviceworker, ...globals.browser },
    },
  },
  // Last, so it switches off any rule that would argue with Prettier about layout.
  prettier,
])
