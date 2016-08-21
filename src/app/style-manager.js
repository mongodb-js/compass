/* eslint no-sync: 0 */

var path = require('path');
var LessCache = require('less-cache');

/**
 * The compile cache directory.
 */
var COMPILE_CACHE_DIR = path.join(__dirname, 'compiled-less');

/**
 * The name of the base styles.
 */
var BASE_STYLES = path.join(__dirname, 'index.less');

/**
 * The style manager, well, manages styles.
 */
function StyleManager() {
  this.cache = new LessCache({
    cacheDir: COMPILE_CACHE_DIR,
    resourcePath: __dirname,
    importPaths: [ __dirname ]
  });
}

/**
 * Writes the compiled styles into the DOM.
 */
StyleManager.prototype.writeStyles = function() {
  var style = document.createElement('style');
  style.textContent = this.cache.readFileSync(BASE_STYLES);
  document.head.appendChild(style);
};

module.exports = new StyleManager();
