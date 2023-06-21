'use strict';

const path = require('path');
const shared = require('@mongodb-js/eslint-config-devtools');
const common = require('@mongodb-js/eslint-config-devtools/common');

const tsRules = {
  ...common.tsRules,
  // Newly converted plugins use `any` quite a lot, we can't enable the rule,
  // but we can warn so we can eventually address this
  '@typescript-eslint/no-unsafe-argument': 'warn',
};

const tsOverrides = {
  ...common.tsOverrides,
};
tsOverrides.rules = { ...tsRules };

const tsxRules = {
  ...common.tsxRules,
  '@typescript-eslint/no-unsafe-argument': 'warn',
};

const tsxOverrides = {
  ...common.tsxOverrides,
};
tsxOverrides.rules = { ...tsxRules };

const testOverrides = {
  ...common.testOverrides,
};
testOverrides.rules = {
  ...common.testRules,
  '@typescript-eslint/no-unsafe-argument': 'off',
  '@typescript-eslint/restrict-template-expressions': 'off',
  '@mongodb-js/compass/unique-mongodb-log-id': 'off',
};

module.exports = {
  plugins: [...shared.plugins, '@mongodb-js/compass'],
  rules: {
    ...shared.rules,
    '@mongodb-js/compass/no-leafygreen-outside-compass-components': 'error',
    '@mongodb-js/compass/unique-mongodb-log-id': [
      'error',
      { root: path.resolve(__dirname, '..', '..') },
    ],
  },
  env: {
    ...shared.env,
  },
  overrides: [
    common.jsOverrides,
    common.jsxOverrides,
    tsOverrides,
    tsxOverrides,
    testOverrides,
  ],
  settings: {
    ...shared.settings,
  },
};
