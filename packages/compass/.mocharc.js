const specs = process.argv.slice(2).filter(arg => !arg.startsWith('-'));

module.exports = {
  ...require('@mongodb-js/mocha-config-compass'),
  ...(specs.length > 0 && {
    spec: specs[0],
    watchFiles: specs[0],
  }),
};
