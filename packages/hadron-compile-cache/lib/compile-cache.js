const path = require('path');
const fs = require('fs-plus');
const debug = require('debug')('hadron-compile-cache:compile-cache');

const BabelCompiler = require('./compiler/babel-compiler');
const MarkdownCompiler = require('./compiler/markdown-compiler');

/**
 * Maps file extensions to compilers.
 */
const COMPILERS = {
  '.jsx': new BabelCompiler(),
  // TODO: lucas: I'm pretty sure md can go away as well? 
  // Probably other optimizations like this (do we even need babel here? should it be updated?)
  // that could result in quick wins or just straight up tech debt drain.
  '.md': new MarkdownCompiler()
};

/**
 * UTF-8 constant for file reading.
 */
const UTF8 = 'utf8';

/**
 * The directory where cached js is stored.
 *
 * @note Things with 'cache' in the name are stripped out of our build process.
 */
const CACHE_DIRECTORY = '.compiled-sources';

/**
 * The root user string.
 */
const ROOT = 'root';

/**
 * Wraps a cache of compiled code.
 */
class CompileCache {

  /**
   * Create a new compile cache.
   */
  constructor() {
    this.homeDirectory = null;
    this.cacheDirectory = null;
    this.digestMappings = {};
    this.isWatching = (process.env.NODE_ENV === 'development');
  }

  /**
   * Set the home directory of the compile cache.
   *
   * @param {String} home - The home directory.
   */
  setHomeDirectory(home) {
    let cacheDir = path.join(home, CACHE_DIRECTORY);
    if (this._isRoot()) {
      cacheDir = path.join(cacheDir, ROOT);
    }
    this.homeDirectory = home;
    this.cacheDirectory = cacheDir;
    this._watchHomeDirectory();
  }

  /**
   * Compile the file at the provided path.
   *
   * @param {Object} compiler - The compiler to use.
   * @param {String} filePath - The path to the file.
   *
   * @returns {String} The compiled file.
   */
  compileFileAtPath(compiler, filePath) {
    const digestedPath = this._digestedPath(compiler, filePath);
    let compiledCode = this._readCachedJavascript(digestedPath);
    if (compiledCode === null) {
      const sourceCode = fs.readFileSync(filePath, UTF8);
      compiledCode = compiler.compile(sourceCode, filePath);
      this._writeCachedJavascript(digestedPath, compiledCode);
    }
    return compiledCode;
  }

  /**
   * Get the digested path for the compiler and filepath.
   *
   * @param {Object} compiler - The compiler to use.
   * @param {String} filePath - The path to the file.
   *
   * @returns {String} The digested path.
   */
  _digestedPath(compiler, filePath) {
    const shortPath = this._shorten(filePath);
    let digestedPath = this.digestMappings[shortPath];
    if (!digestedPath) {
      digestedPath = compiler.getCachePath(shortPath);
      this.digestMappings[shortPath] = digestedPath;
    }
    return digestedPath;
  }

  /**
   * Read javascript from the cache.
   *
   * @param {String} digestedPath - The digested path to the file.
   *
   * @returns {String} The javascript from the cache.
   */
  _readCachedJavascript(digestedPath) {
    const cachePath = path.join(this.cacheDirectory, digestedPath);
    if (fs.isFileSync(cachePath)) {
      try {
        return fs.readFileSync(cachePath, UTF8);
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  /**
   * Remove the cached javascript for the provided file path.
   *
   * @param {String} filePath - The file path.
   *
   * @returns {null} null.
   */
  _removeCachedJavascript(filePath) {
    const compiler = COMPILERS[path.extname(filePath)];
    const digestedPath = this._digestedPath(compiler, filePath);
    const cachePath = path.join(this.cacheDirectory, digestedPath);
    try {
      debug(`Removing cache digest for: ${filePath}`);
      return fs.unlinkSync(cachePath);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get the shortened file path with the home directory stripped off the front.
   *
   * @param {String} filePath - The absolute file path.
   *
   * @returns {String} The shortened file path.
   */
  _shorten(filePath) {
    const stripped = filePath.replace(this.homeDirectory + path.sep, '');
    return stripped.replace(/(\\|\/)/g, '-');
  }

  /**
   * Watch the home directory if configured to do so.
   */
  _watchHomeDirectory() {
    if (this.isWatching) {
      const glob = `${this.homeDirectory}/src/**/*.{jsx,md}`;
      const chokidar = require('chokidar');
      if (this.watcher) {
        this.watcher.close();
      }
      this.watcher = chokidar.watch(glob);
      debug(`Compile cache watching path: ${glob}`);
      this.watcher.on('change', (filePath) => {
        debug(`File changed detected at: ${filePath}`);
        this._removeCachedJavascript(filePath);
      });
    }
  }

  /**
   * Write javascript to the cache.
   *
   * @param {String} relativeCachePath - The relative path.
   * @param {String} code - The compiled code.
   */
  _writeCachedJavascript(relativeCachePath, code) {
    const cachePath = path.join(this.cacheDirectory, relativeCachePath);
    fs.writeFileSync(cachePath, code, UTF8);
  }

  /**
   * Determine if the home directory should be root.
   *
   * @returns {Boolean} If the home directory should be root.
   */
  _isRoot() {
    return process.env.USER === ROOT &&
      process.env.SUDO_USER &&
      process.env.SUDO_USER !== process.env.USER;
  }
}

/**
 * Export the cache singleton.
 */
const CACHE = module.exports = new CompileCache();

/**
 * Hook into the core module require and compile if necessary.
 */
Object.keys(COMPILERS).forEach(function(extension) {
  const compiler = COMPILERS[extension];
  Object.defineProperty(require.extensions, extension, {
    enumerable: true,
    writable: true,
    value: function(module, filePath) {
      const code = CACHE.compileFileAtPath(compiler, filePath);
      return module._compile(code, filePath);
    }
  });
});

module.exports.COMPILERS = COMPILERS;
