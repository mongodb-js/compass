var crypto = require('crypto');
var path = require('path');

/**
 * Load the compile cache defaults for the babel compiler.
 */
var DEFAULTS = require('./babelrc.json');

/**
 * Babel core constant.
 */
var BABEL_CORE = 'babel-core';

/**
 * js extension constant.
 */
var EXT = '.js';

/**
 * Hex constant.
 */
var HEX = 'hex';

/**
 * SHA1 constant.
 */
var SHA1 = 'sha1';

/**
 * UTF-8 constant.
 */
var UTF8 = 'utf8';

/**
 * Create the new babel compiler.
 */
function BabelCompiler() {
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
BabelCompiler.prototype.getCachePath = function(filePath) {
  return path.join(
    this.versionDirectory,
    crypto
      .createHash(SHA1)
      .update(filePath, UTF8)
      .digest(HEX) + EXT
  );
};

/**
 * Compile the jsx with babel.
 *
 * @param {String} sourceCode - The jsx source.
 * @param {String} filePath - The path to the source.
 *
 * @returns {String} The compiled javascript as a string.
 */
BabelCompiler.prototype.compile = function(sourceCode, filePath) {
  var options = { filename: filePath };
  for (var key in DEFAULTS) {  // eslint-disable-line guard-for-in
    options[key] = DEFAULTS[key];
  }
  return this.babel.transform(sourceCode, options).code;
};

/**
 * Determine the path to the cache directory based on the babel version.
 *
 * @returns {String} The version directory path.
 */
BabelCompiler.prototype._createVersionDirectory = function() {
  var version = require('babel-core/package.json').version;
  var digest = this._createDigest(version, DEFAULTS);
  return path.join('js', 'babel', digest);
};

/**
 * Create the cache directory digest.
 *
 * @param {String} version - The babel version.
 * @param {Object} options - The babel options.
 *
 * @return {String} The digest.
 */
BabelCompiler.prototype._createDigest = function(version, options) {
  return crypto
    .createHash(SHA1)
    .update(BABEL_CORE, UTF8)
    .update('\0', UTF8)
    .update(version, UTF8)
    .update('\0', UTF8)
    .update(JSON.stringify(options), UTF8)
    .digest(HEX);
};

module.exports = BabelCompiler;
module.exports.DEFAULTS = DEFAULTS;
