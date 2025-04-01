'use strict';
module.exports = {
  root: true,
  extends: ['@mongodb-js/eslint-config-compass/plugin'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig-lint.json'],
  },
  overrides: [
    {
      files: ['./**/*.ts', './**/*.tsx'],
      rules: {
        // This plugin is desktop-only, so usual import restrictions don't apply
        '@typescript-eslint/no-restricted-imports': 'off',
      },
    },
  ],
};
