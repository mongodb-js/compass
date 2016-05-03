var path = require('path');
var fs = require('fs-plus');

var BabelCompiler = require('./compiler/babel-compiler');
var JadeCompiler = require('./compiler/jade-compiler');

/**
 * Maps file extensions to compilers.
 */
var COMPILERS = {
  '.jade': new JadeCompiler(),
  '.jsx': new BabelCompiler()
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
  this.homeDirectory = null;
  this.cacheDirectory = null;
  this.digestMappings = {};
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
  this.homeDirectory = home;
  this.cacheDirectory = cacheDir;
};

/**
 * Compile the file at the provided path.
 *
 * @param {Object} compiler - The compiler to use.
 * @param {String} filePath - The path to the file.
 *
 * @returns {String} The compiled file.
 */
CompileCache.prototype.compileFileAtPath = function(compiler, filePath) {
  var digestedPath = this._digestedPath(compiler, filePath);
  var compiledCode = this._readCachedJavascript(digestedPath);
  if (compiledCode === null) {
    var sourceCode = fs.readFileSync(filePath, UTF8);
    compiledCode = compiler.compile(sourceCode, filePath);
    this._writeCachedJavascript(digestedPath, compiledCode);
  }
  return compiledCode;
};

/**
 * Get the digested path for the compiler and filepath.
 *
 * @param {Object} compiler - The compiler to use.
 * @param {String} filePath - The path to the file.
 *
 * @returns {String} The digested path.
 */
CompileCache.prototype._digestedPath = function(compiler, filePath) {
  var digestedPath = this.digestMappings[filePath];
  if (!digestedPath) {
    var shortPath = this._shorten(filePath);
    digestedPath = compiler.getCachePath(shortPath);
    this.digestMappings[filePath] = digestedPath;
  }
  return digestedPath;
};

/**
 * Read javascript from the cache.
 *
 * @param {String} digestedPath - The digested path to the file.
 *
 * @returns {String} The javascript from the cache.
 */
CompileCache.prototype._readCachedJavascript = function(digestedPath) {
  var cachePath = path.join(this.cacheDirectory, digestedPath);
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
 * Get the shortened file path with the home directory stripped off the front.
 *
 * @param {String} filePath - The absolute file path.
 *
 * @returns {String} The shortened file path.
 */
CompileCache.prototype._shorten = function(filePath) {
  return filePath.replace(this.homeDirectory + path.sep, '');
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
      var code = CACHE.compileFileAtPath(compiler, filePath);
      return module._compile(code, filePath);
    }
  });
});

module.exports.COMPILERS = COMPILERS;
