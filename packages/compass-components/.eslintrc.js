module.exports = {
  root: true,
  extends: ['@mongodb-js/eslint-config-compass'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    // XXX: Workaround for https://github.com/nodejs/node/issues/34866 that
    // supposedly "never getting fixed"
    project: [require('path').resolve('tsconfig-lint.json')],
  },
};
