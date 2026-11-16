import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // The flow tests were converted from the original game's test file and keep its style
    // and loose typing. Missing imports are still caught, since type checking is off there.
    files: ['src/tests/**'],
    rules: {
      'no-undef': 'error',
      '@typescript-eslint/ban-ts-comment': 'off',
      'prefer-const': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-case-declarations': 'off',
      'no-prototype-builtins': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-empty': 'off',
      'no-useless-assignment': 'off',
      'no-useless-escape': 'off',
      'no-var': 'off',
    },
  },
])
