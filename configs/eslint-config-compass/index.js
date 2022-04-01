const path = require('path');

const jsConfigurations = ['eslint:recommended'];

const tsConfigurations = [
  ...jsConfigurations,
  'plugin:@typescript-eslint/recommended',
  'plugin:@typescript-eslint/recommended-requiring-type-checking',
];

const tsRules = {
  '@typescript-eslint/no-unused-vars': 'error',
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/no-unsafe-call': 'off',
  '@typescript-eslint/no-unsafe-member-access': 'off',
  '@typescript-eslint/no-unsafe-return': 'off',
  '@typescript-eslint/consistent-type-imports': [
    'error',
    { prefer: 'type-imports' },
  ],
};

const reactConfigurations = [
  'plugin:react/recommended',
  'plugin:react-hooks/recommended',
  'plugin:jsx-a11y/recommended',
];

const testConfigurations = ['plugin:mocha/recommended'];

const testRules = {
  'mocha/no-exclusive-tests': 'error',
  'mocha/no-hooks-for-single-case': 'off',
  'mocha/no-setup-in-describe': 'off',
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-empty-function': 'off',
};

const javascriptParserOptions = {
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    requireConfigFile: false,
    babelOptions: {
      presets: [
        require.resolve('@babel/preset-env'),
        require.resolve('@babel/preset-react'),
      ],
    },
  },
};

const typescriptParserOptions = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
};

module.exports = {
  plugins: [
    '@typescript-eslint',
    'jsx-a11y',
    'mocha',
    'react',
    'react-hooks',
    '@mongodb-js/compass',
  ],
  rules: {
    '@mongodb-js/compass/no-leafygreen-outside-compass-components': 'error',
    '@mongodb-js/compass/unique-mongodb-log-id': [
      'error',
      { root: path.resolve(__dirname, '..', '..') },
    ],
  },
  env: { node: true },
  overrides: [
    {
      files: ['**/*.js'],
      ...javascriptParserOptions,
      env: { node: true, es6: true },
      extends: [...jsConfigurations, 'prettier'],
    },
    {
      files: ['**/*.jsx'],
      ...javascriptParserOptions,
      env: { node: true, browser: true, es6: true },
      extends: [...jsConfigurations, ...reactConfigurations, 'prettier'],
    },
    {
      files: ['**/*.ts'],
      ...typescriptParserOptions,
      extends: [...tsConfigurations, 'prettier'],
      rules: { ...tsRules },
    },
    {
      files: ['**/*.tsx'],
      ...typescriptParserOptions,
      env: { node: true, browser: true },
      extends: [...tsConfigurations, ...reactConfigurations, 'prettier'],
      rules: {
        ...tsRules,
        // No reason to have propTypes if your components are strictly typed
        'react/prop-types': 'off',
      },
    },
    {
      files: [
        '**/*.spec.js',
        '**/*.spec.jsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/*.test.js',
        '**/*.test.tsx',
        '**/*.test.ts',
      ],
      env: { mocha: true },
      extends: [...testConfigurations],
      rules: { ...testRules },
    },
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
};
