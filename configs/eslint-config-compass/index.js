'use strict';

const path = require('path');
const shared = require('@mongodb-js/eslint-config-devtools');
const common = require('@mongodb-js/eslint-config-devtools/common');

const extraTsRules = {
  // Newly converted plugins use `any` quite a lot, we can't enable the rule,
  // but we can warn so we can eventually address this
  '@typescript-eslint/no-unsafe-argument': 'warn',
  '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
  '@typescript-eslint/restrict-template-expressions': 'warn',
  '@typescript-eslint/restrict-plus-operands': 'warn',
  '@typescript-eslint/consistent-type-exports': [
    'error',
    { fixMixedExportsWithInlineTypeSpecifier: false },
  ],
};

const tsRules = {
  ...common.tsRules,
  ...extraTsRules,
};

const tsOverrides = {
  ...common.tsOverrides,
  rules: { ...tsRules },
};

const tsxRules = {
  ...common.tsxRules,
  ...extraTsRules,
};

const tsxOverrides = {
  ...common.tsxOverrides,
  rules: { ...tsxRules },
};

const testJsOverrides = {
  ...common.testOverrides,
  files: ['**/*.spec.js', '**/*.spec.jsx', '**/*.test.js'],
  rules: {
    ...common.testRules,
    '@mongodb-js/compass/unique-mongodb-log-id': 'off',
  },
};

const testTsOverrides = {
  files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.test.tsx', '**/*.test.ts'],
  rules: {
    ...common.testRules,
    ...extraTsRules,
    '@mongodb-js/compass/unique-mongodb-log-id': 'off',
  },
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
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.name="setImmediate"]',
        message: 'Use browser-compatible `setTimeout(...)` instead',
      },
      {
        selector:
          'CallExpression[callee.object.name="process"][callee.property.name="nextTick"]',
        message: 'Use browser-compatible `queueMicrotask(...)` instead',
      },
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
    testJsOverrides,
    testTsOverrides,
  ],
  settings: {
    ...shared.settings,
  },
};
