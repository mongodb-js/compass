const path = require('path');
const semver = require('semver');
const autoprefixer = require('autoprefixer');
const packageJson = require(path.join(__dirname, '/../package.json'));

// Gets a valid version range for the current electron dependency declared in our package.json
// Eg: "^1.6.1" would yield ">=1.6.1"
const electronVersion = semver.Range(packageJson.devDependencies.electron).set[0][0].value; // eslint-disable-line new-cap

module.exports = {
  path: {
    // The src path to our application
    src: path.join(__dirname, '/../src'),

    // The build path to where our bundle will be output
    output: path.join(__dirname, '/../lib'),

    // The path to the electron directory
    electron: path.join(__dirname, '/../electron'),

    // The path to the storybook directory
    storybook: path.join(__dirname, '/../.storybook')
  },
  plugin: {
    autoprefixer: autoprefixer(`electron ${electronVersion}`)
  }
};
