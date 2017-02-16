'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const debug = require('debug')('hadron-package-manager:package-manager');
const Package = require('./package');
const Action = require('./action');

/**
 * Manages packages in the application.
 */
class PackageManager {

  /**
   * Instantiate the PackageManager.
   *
   * @param {String} packagesPath - The extra paackages paths.
   */
  constructor(packagesPath, baseDir, externalPackages) {
    this.packagesPath = packagesPath;
    this.baseDir = baseDir;
    this.externalPackages = externalPackages;
    this.expectedPackageCount = 0;
    this.packages = [];
  }

  /**
   * Activate the internal packages. Will read the packages if not already read.
   *
   * Will publish an Action.packageActivationCompleted when all packages
   * have finished being activated.
   *
   * @returns {PackageManager} this instance.
   */
  activate() {
    this.unsubscribePackageRead = Action.packageRead.listen((pkg) => {
      pkg.activate();
      this._completeActivation();
    });
    this.unsubscribePackageScanFailed = Action.packageScanFailed.listen(() => {
      this._completeActivation();
    });
    this._read();
    return this;
  }

  /**
   * Completes the activation of the manager.
   */
  _completeActivation() {
    if (this._isReadingComplete()) {
      this._resetExpectedPackageCount();
      Action.packageActivationCompleted();
      // activation complete, unsubscribe from listeners
      this.unsubscribePackageRead();
      this.unsubscribePackageScanFailed();
    }
  }

  /**
   * Checks if the reading of packages is complete.
   *
   * @returns {Boolean} If the reading is complete.
   */
  _isReadingComplete() {
    return this.expectedPackageCount === this.packages.length;
  }

  /**
   * Attempts to read packages from all the manager's directories.
   * Will fire events based on the packages that were read.
   *
   * @returns {void}.
   */
  _read() {
    if (this.packages.length === 0) {
      this._scanPackagePaths(this.packagesPath);
      _.each(this.externalPackages, (externalPackage) => {
        this._scanPackagePath(this.baseDir, externalPackage);
      });
    }
  }

  /**
   * Reads a package from a file, only if it is a directory. If the
   * file is not a directory it will be ignored and the expected
   * count of loaded packages will be decremented.
   *
   * @param {String} file - The name of the file.
   * @param {String} packagePath - The path to the file.
   *
   * @returns {void}.
   */
  _readPackage(file, packagePath) {
    if (file.isDirectory()) {
      var pkg = new Package(packagePath);
      this.packages.push(pkg);
      Action.packageRead(pkg);
    } else {
      this.expectedPackageCount -= 1;
    }
  }

  /**
   * Resets the expected package count to 0 since the read is done.
   */
  _resetExpectedPackageCount() {
    this.expectedPackageCount = 0;
  }

  /**
   * Scans a single file and attempts to read into a package.
   *
   * @param {Array} packagesPath - The path to the packages.
   * @param {String} file - The file in the directory.
   *
   * @returns {void}.
   */
  _scanPackagePath(packagesPath, file) {
    var packagePath = path.join(packagesPath, file);
    this.expectedPackageCount += 1;
    fs.stat(packagePath, (error, f) => {
      if (error) {
        debug(error);
      } else {
        this._readPackage(f, packagePath);
      }
    });
  }

  /**
   * Scans the entires packages path for potential directories that could
   * contain packages.
   *
   * @param {String} packagesPath - The path to the packages.
   *
   * @returns {void}.
   */
  _scanPackagePaths(packagesPath) {
    fs.readdir(packagesPath, (error, files) => {
      if (error) {
        Action.packageScanFailed(error);
      } else {
        _.each(files, (file) => {
          this._scanPackagePath(packagesPath, file);
        });
      }
    });
  }
}

module.exports = PackageManager;
