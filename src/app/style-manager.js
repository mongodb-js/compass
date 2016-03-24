'use strict';

const path = require('path');
const LessCache = require('less-cache');

/**
 * The compile cache directory.
 */
const COMPILE_CACHE_DIR = path.join(__dirname, '.less-compile-cache');

/**
 * The name of the base styles.
 */
const BASE_STYLES = path.join(__dirname, 'index.less');

/**
 * The style manager, well, manages styles.
 */
class StyleManager {
  /**
   * Instantiate the new style manager, creating the less cache.
   */
  constructor() {
    this.cache = new LessCache({ cacheDir: COMPILE_CACHE_DIR });
  }

  /**
   * Writes the compiled styles into the DOM.
   */
  writeStyles() {
    var style = document.createElement('style');
    style.textContent = this.cache.readFileSync(BASE_STYLES);
    document.head.appendChild(style);
  }
}

module.exports = new StyleManager();
