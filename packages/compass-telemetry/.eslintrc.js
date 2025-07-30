module.exports = {
  root: true,
  extends: ['@mongodb-js/eslint-config-compass'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig-lint.json'],
  },
  overrides: [
    {
      files: ['./src/**/*.ts', './src/**/*.tsx'],
      rules: {
        'no-restricted-imports': 'off',
        '@typescript-eslint/no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: '@mongodb-js/mdb-experiment-js',
                message:
                  'Use type-only imports from @mongodb-js/mdb-experiment-js',
                allowTypeImports: true,
              },
            ],
          },
        ],
        '@typescript-eslint/no-redundant-type-constituents': 'off',
      },
    },
  ],
};
