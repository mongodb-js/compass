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
