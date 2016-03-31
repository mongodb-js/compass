'use strict';

const path = require('path');

/**
 * The package cache.
 */
const Cache = {};

/**
 * Define the filename constant.
 */
const PACKAGE_FILENAME = 'package.json';

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
    this.metadata = require(path.resolve(this.packagePath, PACKAGE_FILENAME));
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
    var module = require(path.resolve(this.packagePath, this.metadata.main));
    Cache[this.packagePath] = module;
    return module;
  }

  /**
   * Activate the package. If the package has not yet been loaded, this method
   * will ensure it.
   *
   * @returns {Object} The return value of the activate function in the module.
   */
  activate() {
    return this.load().activate();
  }
}

module.exports = Package;
module.exports.Cache = Cache;
