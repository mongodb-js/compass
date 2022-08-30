const path = require('path');

module.exports = {
  path: {
    // The src path to our application
    src: path.join(__dirname, '/../src'),

    // The build path to where our bundle will be output
    output: path.join(__dirname, '/../lib'),

    // The path to the electron directory
    electron: path.join(__dirname, '/../electron')
  },
  plugin: {
    autoprefixer: require('autoprefixer')
  }
};
