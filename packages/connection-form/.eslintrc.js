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
        // 'mongodb' package has been moved to devDependencies in this package, to
        // aid in the usage of this package inside the VSCode extension's webview.
        // Otherwise it would have been necessary to provide several polyfills for
        // the dependencies of 'mongodb' package when webpacking it for an
        // environment other than node. Hence we are restricting the usage of this
        // package to type only imports.
        '@typescript-eslint/no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'mongodb',
                allowTypeImports: true,
                message: "Only type imports allowed from 'mongodb'",
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
