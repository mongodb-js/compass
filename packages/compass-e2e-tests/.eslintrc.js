'use strict';

const globals = require('globals');

const browserGlobals = Object.keys(globals.browser);
const nodeGlobals = Object.keys(globals.node);
const browserOnlyGlobals = browserGlobals.filter(
  (key) => !nodeGlobals.includes(key)
);

module.exports = {
  root: true,
  extends: ['@mongodb-js/eslint-config-compass'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  overrides: [
    {
      files: ['**/*.ts'],
      rules: {
        'no-console': 0,
        'no-restricted-globals': ['error', ...browserOnlyGlobals],
      },
    },
    {
      // We need to access these in `browser.execute` calls
      files: ['tests/**/*.ts', 'helpers/**/*.ts'],
      rules: {
        'no-restricted-globals': ['warn', ...browserOnlyGlobals],
      },
    },
  ],
};
