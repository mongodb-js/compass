const crypto = require('crypto');
const debug = require('debug')('hadron-compile-cache:babel-compiler');
const path = require('path');

/**
 * Load the compile cache defaults for the babel compiler.
 */
const DEFAULTS = require('./babelrc.json');

/**
 * Babel core constant.
 */
const BABEL_CORE = 'babel-core';

/**
 * js extension constant.
 */
const EXT = '.js';

/**
 * Hex constant.
 */
const HEX = 'hex';

/**
 * SHA1 constant.
 */
const SHA1 = 'sha1';

/**
 * UTF-8 constant.
 */
const UTF8 = 'utf8';

/**
 * Compiles with babel.
 */
class BabelCompiler {

  /**
   * Create the new babel compiler.
   */
  constructor() {
    this.babel = require(BABEL_CORE);
    this.versionDirectory = this._createVersionDirectory();
  }

  /**
   * Get the cache path for the source code.
   *
   * @param {String} filePath - The shortened file path.
   *
   * @returns {String} The cache path.
   */
  getCachePath(filePath) {
    return path.join(
      this.versionDirectory,
      crypto
        .createHash(SHA1)
        .update(filePath, UTF8)
        .digest(HEX) + EXT
    );
  }

  /**
   * Compile the jsx with babel.
   *
   * @param {String} sourceCode - The jsx source.
   * @param {String} filePath - The path to the source.
   *
   * @returns {String} The compiled javascript as a string.
   */
  compile(sourceCode, filePath) {
    debug('Compiling ' + filePath);
    const options = { filename: filePath };
    for (let key in DEFAULTS) {  // eslint-disable-line guard-for-in
      options[key] = DEFAULTS[key];
    }
    return this.babel.transform(sourceCode, options).code;
  }

  /**
   * Determine the path to the cache directory based on the babel version.
   *
   * @returns {String} The version directory path.
   */
  _createVersionDirectory() {
    const version = require('babel-core/package.json').version;
    const digest = this._createDigest(version, DEFAULTS);
    return path.join('js', 'babel', digest);
  }

  /**
   * Create the cache directory digest.
   *
   * @param {String} version - The babel version.
   * @param {Object} options - The babel options.
   *
   * @return {String} The digest.
   */
  _createDigest(version, options) {
    return crypto
      .createHash(SHA1)
      .update(BABEL_CORE, UTF8)
      .update('\0', UTF8)
      .update(version, UTF8)
      .update('\0', UTF8)
      .update(JSON.stringify(options), UTF8)
      .digest(HEX);
  }
}

module.exports = BabelCompiler;
module.exports.DEFAULTS = DEFAULTS;
