const crypto = require('crypto');
const path = require('path');
const debug = require('debug')('hadron-compile-cache:markdown-compiler');
const highlight = require('highlight.js');

/**
 * Hex constant.
 */
const HEX = 'hex';

/**
 * SHA1 constant.
 */
const SHA1 = 'sha1';

/**
 * The md constant.
 */
const MARKDOWN = 'md';

/**
 * js extension constant.
 */
const EXT = '.js';

/**
 * The semicolon.
 */
const SEMI = ';';

/**
 * The module export for the template.
 */
const MODULE_EXPORT = 'module.exports = ';

/**
 * The options for the parser.
 */
const OPTIONS = {
  marked: {
    highlight: function(code) {
      return highlight.highlightAuto(code).value;
    }
  }
};

/**
 * UTF-8 constant for file reading.
 */
const UTF8 = 'utf8';

/**
 * Compiles markdown.
 */
class MarkdownCompiler {
  /**
   * Instantiate the markdown compiler.
   */
  constructor() {
    this.mm = require('marky-mark');
  }

  /**
   * Get the cache path for all compiled markdown templates.
   *
   * @param {String} filePath - The shortened file path.
   *
   * @returns {String} The cache path for compiled markdown templates.
   */
  getCachePath(filePath) {
    return path.join(
      MARKDOWN,
      crypto.createHash(SHA1).update(filePath, UTF8).digest(HEX) + EXT
    );
  }

  /**
   * Compile the markdown file with the compiler.
   *
   * @param {String} sourceCode - The markdown source.
   * @param {String} filePath - The path to the source.
   *
   * @returns {String} The compiled html as a string.
   */
  compile(sourceCode, filePath) {
    debug('Compiling ' + filePath);
    const code = this.mm.parse(sourceCode, OPTIONS);
    code.filename = path.basename(filePath);
    return this._appendExports(code);
  }

  /**
   * Since the compiled markdown is a javascript object, we need to
   * prep it to work as a require statement.
   *
   * @param {String} code - The compiled object.
   *
   * @returns {String} The code with the exported function.
   */
  _appendExports(code) {
    return MODULE_EXPORT + JSON.stringify(code, null, 2) + SEMI;
  }
}

module.exports = MarkdownCompiler;
