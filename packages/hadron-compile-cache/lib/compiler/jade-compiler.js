var crypto = require('crypto');
var path = require('path');

/**
 * The jade constant.
 */
var JADE = 'jade';

/**
 * Instantiate the Jade compiler.
 */
function JadeCompiler() {
  this.jade = require('jade');
}

/**
 * Should we compile all .jade files?
 *
 * @returns {Boolean} Always true.
 */
JadeCompiler.prototype.shouldCompile = function() {
  return true;
};

/**
 * Get the cache path for all compiled jade templates.
 *
 * @param {String} sourceCode - The source code.
 *
 * @returns {String} The cache path for compiled jade templates.
 */
JadeCompiler.prototype.getCachePath = function(sourceCode) {
  return path.join(
    JADE,
    crypto.createHash('sha1').update(sourceCode, 'utf8').digest('hex') + '.js'
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
  return 'var jade = require("@lukekarrys/jade-runtime");' +
    '\n' +
    code +
    '\n' +
    'module.exports = template;';
};

module.exports = JadeCompiler;
