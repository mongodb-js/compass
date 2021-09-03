const jsConfigurations = ['eslint:recommended'];

const tsConfigurations = [
  ...jsConfigurations,
  'plugin:@typescript-eslint/recommended',
  'plugin:@typescript-eslint/recommended-requiring-type-checking',
];
const tsRules = {
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/no-unsafe-call': 'off',
  '@typescript-eslint/no-unsafe-member-access': 'off',
  '@typescript-eslint/no-unsafe-return': 'off',
};

const reactConfigurations = [
  'plugin:react/recommended',
  'plugin:jsx-a11y/recommended',
];

const testConfigurations = ['plugin:mocha/recommended'];

module.exports = {
  plugins: ['@typescript-eslint', 'jsx-a11y', 'mocha', 'react'],
  env: { node: true },
  overrides: [
    {
      parserOptions: {
        ecmaVersion: 12,
      },
      files: ['**/*.js'],
      env: { node: true, es6: true },
      extends: [...jsConfigurations, 'prettier'],
    },
    {
      parser: '@typescript-eslint/parser',
      files: ['**/*.ts'],
      extends: [...tsConfigurations, 'prettier'],
      rules: { ...tsRules },
    },
    {
      parserOptions: {
        ecmaVersion: 2018,
      },
      files: ['**/*.jsx'],
      env: { node: true, browser: true, es6: true },
      extends: [...jsConfigurations, ...reactConfigurations, 'prettier'],
    },
    {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      files: ['**/*.tsx'],
      env: { node: true, browser: true },
      extends: [...tsConfigurations, ...reactConfigurations, 'prettier'],
      rules: { ...tsRules },
    },
    {
      files: ['**/*.spec.js', '**/*.spec.jsx', '**/*.spec.ts', '**/*.spec.tsx', '**/*.test.js'],
      env: { mocha: true },
      extends: [...testConfigurations],
    },
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
};
