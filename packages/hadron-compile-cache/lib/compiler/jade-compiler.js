var crypto = require('crypto');
var path = require('path');

/**
 * Hex constant.
 */
var HEX = 'hex';

/**
 * SHA1 constant.
 */
var SHA1 = 'sha1';

/**
 * The jade constant.
 */
var JADE = 'jade';

/**
 * The require for the Jade runtime.
 */
var JADE_REQUIRE = 'var jade = require("@lukekarrys/jade-runtime");';

/**
 * js extension constant.
 */
var EXT = '.js';

/**
 * The line break character.
 */
var LINE_BREAK = '\n';

/**
 * The module export for the template.
 */
var MODULE_EXPORT = 'module.exports = template;';

/**
 * UTF-8 constant for file reading.
 */
var UTF8 = 'utf8';

/**
 * Instantiate the Jade compiler.
 */
function JadeCompiler() {
  this.jade = require(JADE);
}

/**
 * Get the cache path for all compiled jade templates.
 *
 * @param {String} filePath - The shortened file path.
 *
 * @returns {String} The cache path for compiled jade templates.
 */
JadeCompiler.prototype.getCachePath = function(filePath) {
  return path.join(
    JADE,
    crypto.createHash(SHA1).update(filePath, UTF8).digest(HEX) + EXT
  );
};

/**
 * Compile the jade template.
 *
 * @param {String} sourceCode - The raw jade template.
 * @param {String} filePath - The path to the source.
 *
 * @returns {String} The compiled javascript as a string.
 */
JadeCompiler.prototype.compile = function(sourceCode, filePath) {
  if (process.platform === 'win32') {
    filePath = 'file:///' + path.resolve(filePath).replace(/\\/g, '/');
  }
  var code = this.jade.compileClient(sourceCode, { filename: filePath, cache: false });
  return this._appendExports(code);
};

/**
 * Since the compiled jade is only a private function, we need to
 * export it to work in the normal compile cache flow and include the
 * jade runtime.
 *
 * @param {String} code - The compiled jade function.
 *
 * @returns {String} The code with the exported function.
 */
JadeCompiler.prototype._appendExports = function(code) {
  return JADE_REQUIRE + LINE_BREAK + code + LINE_BREAK + MODULE_EXPORT;
};

module.exports = JadeCompiler;
