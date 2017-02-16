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
    require('babel-register')({
      extensions: ['.jsx'],
      ignore: false
    });
  }
}

module.exports = new Environment();
