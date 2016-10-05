'use strict';

/* eslint no-sync: 0 */
const LessCache = require('less-cache');

/**
 * The style tag constant.
 */
const STYLE = 'style';

/**
 * Manas styles for a hadron application.
 */
class StyleManager {

  /**
   * The style manager loads styles from the less cache.
   *
   * @param {String} cacheDir - Where to store the cached less.
   * @param {String} resourcePath - Where to look for less resources.
   */
  constructor(cacheDir, resourcePath) {
    this.cache = new LessCache({
      cacheDir: cacheDir,
      resourcePath: resourcePath,
      importPaths: [ resourcePath ]
    });
  }

  /**
   * Use the provided stylesheet, either directly from the cache
   * or compile it and then return it.
   *
   * @param {Document} doc - The document that uses the stylesheet.
   * @param {String} stylesheet - The stylesheet.
   */
  use(doc, stylesheet) {
    const styles = doc.createElement(STYLE);
    styles.textContent = this.cache.readFileSync(stylesheet);
    doc.head.appendChild(styles);
  }
}

module.exports = StyleManager;
