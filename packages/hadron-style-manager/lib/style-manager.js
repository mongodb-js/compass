'use strict';

/* eslint no-sync: 0 */
const LessCache = require('less-cache');
const fs = require('fs');
const path = require('path');
const pkgUp = require('pkg-up');

/**
 * The style tag constant.
 */
const STYLE = 'style';

/**
 * Manas styles for a hadron application.
 */
class StyleManager {
  /**
   * For use in a build system when one wants to generate the css
   * at build time and insert them into the document <head>.
   *
   * This is only for use at build time.
   *
   * @param {String} file - The path to the file.
   * @param {String} stylesheet - The path to the stylesheet.
   * @param {Function} done - The callback to execute.
   */
  build(file, stylesheet, done) {
    fs.readFile(file, (error, data) => {
      if (error) {
        return done(error);
      }
      const html = this._buildHtml(data, stylesheet);
      fs.writeFile(file, html, (err) => {
        if (err) {
          return done(err);
        }
        done(null, html);
      });
    });
  }

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
   * Load all stylesheets from the list of packages.
   *
   * @param {Document} doc - The document that uses the stylesheet.
   * @param {String} root - The root folder.
   * @param {Array} packages - The list of packages.
   */
  load(doc, root, packages) {
    for (let pluginNameOrPath of packages) {
      let pluginPath;
      try {
        pluginPath = path.dirname(
          pkgUp.sync({ cwd: require.resolve(pluginNameOrPath) })
        );
      } catch (e) {
        pluginPath = path.join(root, pluginNameOrPath);
      }
      const fullDir = path.join(pluginPath, 'styles', 'index.less');
      this.use(doc, fullDir);
    }
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

  _buildHtml(data, stylesheet) {
    const cheerio = require('cheerio');
    const $ = cheerio.load(data);
    $('head').append(`<style>\n${this.cache.readFileSync(stylesheet)}</style>\n`);
    return $.html();
  }
}

module.exports = StyleManager;
