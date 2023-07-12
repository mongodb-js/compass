module.exports = {
  root: true,
  extends: ['@mongodb-js/eslint-config-compass'],
  overrides: [
    {
      files: ['**/*.js'],
      rules: {
        'no-console': 0,
      },
    },
  ],
};
