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
    this._registerBabel();
  }

  /**
   * Returns the package.json for Compass.
   *
   * @returns {Object} The package.json, loaded.
   */
  packageJSON() {
    return pkg;
  }

  /**
   * Register babel to transform .jsx files.
   */
  _registerBabel() {
    require("babel-register")({ extensions: [".jsx"] });
  }
}

module.exports = new Environment();
