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
      files: ['./scripts/**/*.ts', './src/**/*.ts', './src/**/*.tsx'],
      rules: {
        // This plugin is an exception from the general rule
        '@typescript-eslint/no-restricted-imports': 'off',
      },
    },
  ],
};
