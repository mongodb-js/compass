module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'jsx-a11y',
    'mocha',
    'react'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:mocha/recommended',
    'plugin:jsx-a11y/recommended'
  ],
  env: { node: true },
  overrides: [
    {
      files: ['src/**/*.test.ts'],
      env: { mocha: true },
    },
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    }
  }
};