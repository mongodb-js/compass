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

  // TODO: turn those back on
  '@typescript-eslint/prefer-promise-reject-errors': 'off',
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-base-to-string': 'off',
  '@typescript-eslint/no-unsafe-declaration-merging': 'off',
  '@typescript-eslint/unbound-method': 'off',
  '@typescript-eslint/no-redundant-type-constituents': 'off',
  '@typescript-eslint/no-duplicate-type-constituents': 'off',
  '@typescript-eslint/only-throw-error': 'off',
  '@typescript-eslint/no-unsafe-enum-comparison': 'off',
  '@typescript-eslint/no-misused-promises': 'off',
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
  'react-hooks/exhaustive-deps': [
    'warn',
    {
      additionalHooks: 'useTrackOnChange',
    },
  ],
};

const tsxOverrides = {
  ...common.tsxOverrides,
  rules: { ...tsxRules },
};

const commonTestOverrides = {
  '@mongodb-js/compass/unique-mongodb-log-id': 'off',
  '@typescript-eslint/no-restricted-imports': [
    'error',
    {
      patterns: [
        {
          group: ['@testing-library/*'],
          message: 'Use @mongodb-js/testing-library-compass instead',
          allowTypeImports: false,
        },
      ],
    },
  ],
  // Due do chai triggering these rules erroneously in a lot of cases
  'no-unused-expressions': 'off',
  '@typescript-eslint/no-unused-expressions': 'off',

  // TODO: turn these back on
  'mocha/consistent-spacing-between-blocks': 'off',
};

const testJsOverrides = {
  ...common.testOverrides,
  files: ['**/*.spec.js', '**/*.spec.jsx', '**/*.test.js', '**/test/**/*.js'],
  rules: {
    ...common.testRules,
    ...commonTestOverrides,
  },
};

const testTsOverrides = {
  files: [
    '**/*.spec.ts',
    '**/*.spec.tsx',
    '**/*.test.tsx',
    '**/*.test.ts',
    '**/test/**/*.ts',
  ],
  rules: {
    ...common.testRules,
    ...extraTsRules,
    ...commonTestOverrides,
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
