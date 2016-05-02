const path = require('path');
const pkg = require('../package.json');

/**
 * Sets up the Compass environment.
 */
class Environment {

  /**
   * Adds the modules in the provided directory to the global modules.
   *
   * @param {String} dir - The directory to add.
   */
  addGlobalModules(dir) {
    var mod = require('module').Module;
    mod.globalPaths.push(dir);
    process.env.NODE_PATH = mod.globalPaths.join(path.delimiter);
    mod._initPaths();
  }

  /**
   * Initialize the environment.
   */
  init() {
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
