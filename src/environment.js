'use strict';

const path = require('path');
const pkg = require('../package.json');

/**
 * Sets up the Compass environment.
 */
class Environment {

  /**
   * Initialize the environment.
   */
  init() {
    var mod = require('module').Module;
    var exportDir = path.resolve('src', 'export');
    mod.globalPaths.push(exportDir);
    process.env.NODE_PATH = mod.globalPaths.join(path.delimiter);
    mod._initPaths();
  }

  /**
   * Returns the package.json for Compass.
   *
   * @returns {Object} The package.json, loaded.
   */
  packageJSON() {
    return pkg;
  }
}

module.exports = new Environment();
