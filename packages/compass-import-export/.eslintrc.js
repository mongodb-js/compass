'use strict';
module.exports = {
  root: true,
  extends: ['@mongodb-js/eslint-config-compass/plugin'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  overrides: [
    {
      // Development scripts run on Node.js
      files: ['./scripts/**/*.ts'],
      rules: {
        '@typescript-eslint/no-restricted-imports': 'off',
      },
    },
  ],
};
