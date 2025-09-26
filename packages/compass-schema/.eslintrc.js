'use strict';
module.exports = {
  root: true,
  extends: ['@mongodb-js/eslint-config-compass/plugin'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  env: {
    node: true,
    browser: true,
  },
};
