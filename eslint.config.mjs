import eslint from '@eslint/js';
import pluginImport from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    settings: {
      'import/extensions': ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],
      'import/resolver': {
        node: {
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],
        },
      },
    },
    plugins: {
      import: pluginImport,
    },
    rules: {
      'import/no-cycle': ['error', { ignoreExternal: true }],
    },
  },
  {
    // Service Worker 运行环境：无 window，使用 self / caches 等 Web Worker 全局
    files: ['public/sw.js'],
    languageOptions: {
      globals: {
        self: 'readonly',
        caches: 'readonly',
        clients: 'readonly',
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
      },
    },
  },
  globalIgnores([
    'dist/**',
    'dist-server/**',
    'node_modules/**',
    'scripts/**',
  ]),
]);
