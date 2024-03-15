module.exports = {
  ...require('@cloud-mongodb-js/mocha-config-compass'),
  spec: ['rules/**/*.test.js'],
  watchFiles: ['rules/**/*.js'],
};
