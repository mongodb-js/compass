module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    tsconfigRootDir: __dirname,
    project: ['./tsconfig-lint.json']
  },
  plugins: [
    '@typescript-eslint',
    'jsx-a11y',
    'mocha',
    'react'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:mocha/recommended',
    'plugin:jsx-a11y/recommended'
  ],
  env: { node: true },
  overrides: [
    {
      files: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
      env: { mocha: true },
    },
  ],
  settings: {
    react: {
      version: 'detect'
    },
  }
};