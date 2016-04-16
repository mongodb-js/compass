var path = require('path');
var fs = require('fs-plus');

var JadeCompiler = require('./compiler/jade-compiler');

/**
 * Maps file extensions to compilers.
 */
var COMPILERS = {
  '.jade': new JadeCompiler()
};

/**
 * UTF-8 constant for file reading.
 */
var UTF8 = 'utf8';

/**
 * The directory where cached js is stored.
 *
 * @note Things with 'cache' in the name are stripped out of our build process.
 */
var CACHE_DIRECTORY = '.compiled-sources';

/**
 * The root user string.
 */
var ROOT = 'root';

/**
 * Create a new compile cache.
 */
function CompileCache() {
  this.cacheDirectory = null;
}

/**
 * Set the home directory of the compile cache.
 *
 * @param {String} home - The home directory.
 */
CompileCache.prototype.setHomeDirectory = function(home) {
  var cacheDir = path.join(home, CACHE_DIRECTORY);
  if (this._isRoot()) {
    cacheDir = path.join(cacheDir, ROOT);
  }
  this.cacheDirectory = cacheDir;
};

/**
 * Compile the file at the provided path.
 *
 * @param {Object} compiler - The compiler to use.
 * @param {String} filePath - The path to the file.
 * @param {String} extension - The file extension.
 *
 * @returns {String} The compiled file.
 */
CompileCache.prototype.compileFileAtPath = function(compiler, filePath) {
  var sourceCode = fs.readFileSync(filePath, UTF8);
  if (compiler.shouldCompile(sourceCode, filePath)) {
    var cachePath = compiler.getCachePath(sourceCode, filePath);
    var compiledCode = this._readCachedJavascript(cachePath);
    if (compiledCode === null) {
      compiledCode = compiler.compile(sourceCode, filePath);
      this._writeCachedJavascript(cachePath, compiledCode);
    }
    return compiledCode;
  }
  return sourceCode;
};

/**
 * Read javascript from the cache.
 *
 * @param {String} relativeCachePath - The relative path.
 *
 * @returns {String} The javascript from the cache.
 */
CompileCache.prototype._readCachedJavascript = function(relativeCachePath) {
  var cachePath = path.join(this.cacheDirectory, relativeCachePath);
  if (fs.isFileSync(cachePath)) {
    try {
      return fs.readFileSync(cachePath, UTF8);
    } catch (error) {
      return null;
    }
  }
  return null;
};

/**
 * Write javascript to the cache.
 *
 * @param {String} relativeCachePath - The relative path.
 * @param {String} code - The compiled code.
 */
CompileCache.prototype._writeCachedJavascript = function(relativeCachePath, code) {
  var cachePath = path.join(this.cacheDirectory, relativeCachePath);
  fs.writeFileSync(cachePath, code, UTF8);
};

/**
 * Determine if the home directory should be root.
 *
 * @returns {Boolean} If the home directory should be root.
 */
CompileCache.prototype._isRoot = function() {
  return process.env.USER === ROOT &&
    process.env.SUDO_USER &&
    process.env.SUDO_USER !== process.env.USER;
};

/**
 * Export the cache singleton.
 */
var CACHE = module.exports = new CompileCache();

/**
 * Hook into the core module require and compile if necessary.
 */
Object.keys(COMPILERS).forEach(function(extension) {
  var compiler = COMPILERS[extension];
  Object.defineProperty(require.extensions, extension, {
    enumerable: true,
    writable: true,
    value: function(module, filePath) {
      var code = CACHE.compileFileAtPath(compiler, filePath, extension);
      return module._compile(code, filePath);
    }
  });
});

module.exports.COMPILERS = COMPILERS;
