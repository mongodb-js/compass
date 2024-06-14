'use strict';
module.exports = {
  root: true,
  extends: ['@mongodb-js/eslint-config-compass'],
  overrides: [
    {
      files: ['**/*.js', '**/*.ts'],
      rules: {
        'no-console': 0,
      },
    },
  ],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig-lint.json'],
  },
};
