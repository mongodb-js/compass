const crypto = require('crypto');
const debug = require('debug')('hadron-compile-cache:jade-compiler');
const path = require('path');

/**
 * Hex constant.
 */
const HEX = 'hex';

/**
 * SHA1 constant.
 */
const SHA1 = 'sha1';

/**
 * The jade constant.
 */
const JADE = 'jade';

/**
 * The require for the Jade runtime.
 */
const JADE_REQUIRE = 'var jade = require("@lukekarrys/jade-runtime");';

/**
 * js extension constant.
 */
const EXT = '.js';

/**
 * The line break character.
 */
const LINE_BREAK = '\n';

/**
 * The module export for the template.
 */
const MODULE_EXPORT = 'module.exports = template;';

/**
 * UTF-8 constant for file reading.
 */
const UTF8 = 'utf8';

/**
 * Compiles jade sources.
 */
class JadeCompiler {

  /**
   * Instantiate the Jade compiler.
   */
  constructor() {
    this.jade = require(JADE);
  }

  /**
   * Get the cache path for all compiled jade templates.
   *
   * @param {String} filePath - The shortened file path.
   *
   * @returns {String} The cache path for compiled jade templates.
   */
  getCachePath(filePath) {
    return path.join(
      JADE,
      crypto.createHash(SHA1).update(filePath, UTF8).digest(HEX) + EXT
    );
  }

  /**
   * Compile the jade template.
   *
   * @param {String} sourceCode - The raw jade template.
   * @param {String} filePath - The path to the source.
   *
   * @returns {String} The compiled javascript as a string.
   */
  compile(sourceCode, filePath) {
    debug('Compiling ' + filePath);
    if (process.platform === 'win32') {
      filePath = 'file:///' + path.resolve(filePath).replace(/\\/g, '/');
    }
    const code = this.jade.compileClient(sourceCode, { filename: filePath, cache: false });
    return this._appendExports(code);
  }

  /**
   * Since the compiled jade is only a private function, we need to
   * export it to work in the normal compile cache flow and include the
   * jade runtime.
   *
   * @param {String} code - The compiled jade function.
   *
   * @returns {String} The code with the exported function.
   */
  _appendExports(code) {
    return JADE_REQUIRE + LINE_BREAK + code + LINE_BREAK + MODULE_EXPORT;
  }
}

module.exports = JadeCompiler;
