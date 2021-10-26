module.exports = {
  root: true,
  extends: ['@mongodb-js/eslint-config-compass'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig-lint.json'],
  },
  overrides: [
    {
      // Renderer process code
      files: ['./src/app/**/*.*'],
      globals: {
        jQuery: 'readonly',
        $: 'readonly',
      },
      env: { node: true, browser: true },
    },
    {
      // Main process code
      files: ['./src/main/**/*.*'],
      env: { node: true, browser: false },
    },
  ],
};
