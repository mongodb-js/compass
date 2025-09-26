'use strict';
module.exports = {
  root: true,
  extends: ['@mongodb-js/eslint-config-compass'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  overrides: [
    {
      files: ['./src/**/*.ts', './src/**/*.tsx'],
      rules: {
        // See -
        // https://typescript-eslint.io/rules/no-restricted-imports/#how-to-use
        'no-restricted-imports': 'off',
        '@typescript-eslint/no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['@mongodb-js/connection-storage', 'mongodb'],
                message:
                  '@mongodb-js/connection-form package is shared between Compass and VSCode and should use Compass-specific packages only for type definitions',
                allowTypeImports: true,
              },
            ],
          },
        ],
      },
    },
    {
      files: ['./src/**/*.spec.ts'],
      rules: {
        '@typescript-eslint/no-restricted-imports': ['off'],
      },
    },
  ],
};
