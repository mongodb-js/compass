'use strict';
module.exports = {
  root: true,
  extends: ['@mongodb-js/eslint-config-compass'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig-lint.json'],
  },
  overrides: [
    {
      files: ['**/*.mjs'],
      parserOptions: {
        ecmaVersion: 2023,
        sourceType: 'module',
      },
      env: {
        es2023: true,
        node: true,
      },
    },
  ],
};
