'use strict';

const path = require('path');
const debug = require('debug')('hadron-package-manager:package');

/**
 * The package cache.
 */
const Cache = {};

/**
 * Define the filename constant.
 */
const PACKAGE_FILENAME = 'package.json';

/**
 * The default main package entry point.
 */
const DEFAULT_MAIN = 'index.js';

/**
 * Represents a package to the application.
 */
class Package {

  /**
   * Instantiate the package.
   *
   * @param {string} packagePath - The path to the package.
   *
   * @todo: Durran: Move to separate mongodb-js module. Can be reused by other apps.
   */
  constructor(packagePath) {
    this.packagePath = packagePath;
    this.isActivated = false;
    try {
      this.metadata = require(path.resolve(this.packagePath, PACKAGE_FILENAME));
    } catch (e) {
      debug(e.message);
      debug(`Could not load package.json from ${this.packagePath}, using default index.js as main.`);
      this.metadata = { main: DEFAULT_MAIN };
    }
  }

  /**
   * Load the package. Will happen only once and subsequently will be pulled
   * from the cache.
   *
   * @returns {module} The loaded module.
   */
  load() {
    if (Cache.hasOwnProperty(this.packagePath)) {
      return Cache[this.packagePath];
    }
    const module = require(path.resolve(this.packagePath, this.metadata.main));
    Cache[this.packagePath] = module;
    return module;
  }

  /**
   * Activate the package. If the package has not yet been loaded, this method
   * will ensure it.
   *
   * @param {AppRegistry} appRegistry - The app registry.
   *
   * @returns {Object} The return value of the activate function in the module.
   */
  activate(appRegistry) {
    try {
      const value = this.load().activate(appRegistry);
      this.isActivated = true;
      return value;
    } catch (e) {
      this.error = e;
    }
  }
}

module.exports = Package;
module.exports.Cache = Cache;
