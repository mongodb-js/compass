'use strict';

const async = require('async');
const fs = require('fs');
const path = require('path');
const Package = require('./package');
const Action = require('./action');

/**
 * Manages packages in the application.
 */
class PackageManager {

  /**
   * Instantiate the PackageManager.
   *
   * @param {String} paths - The paths to look for packages in.
   * @param {String} baseDir - The base directory.
   * @param {Array} packageList - A list of individual packages.
   */
  constructor(paths, baseDir, packageList) {
    this.paths = paths;
    this.baseDir = baseDir;
    this.packageList = packageList;
    this.packages = [];
  }

  /**
   * Activate all the packages.
   */
  activate() {
    async.series([
      this._loadPackagesFromPaths.bind(this),
      this._loadPackageList.bind(this)
    ], () => {
      Action.packageActivationCompleted();
    });
  }

  _loadPackagesFromPaths(done) {
    async.each(this.paths, (pkgPath, d) => {
      this._loadPath(pkgPath, d);
    }, () => {
      done();
    });
  }

  _loadPackageList(done) {
    async.each(this.packageList, (pkgPath, d) => {
      this._loadPackage(this.baseDir, pkgPath, d);
    }, () => {
      done();
    });
  }

  _loadPath(pkgPath, done) {
    fs.readdir(pkgPath, (error, files) => {
      if (error) {
        done();
      } else {
        async.each(files, (file, d) => {
          this._loadPackage(pkgPath, file, d);
        }, () => {
          done();
        });
      }
    });
  }

  _loadPackage(pkgPath, file, done) {
    const packagePath = path.join(pkgPath, file);
    fs.stat(packagePath, (error, f) => {
      if (error) {
        return done();
      }
      this._readPackage(f, packagePath, done);
    });
  }

  _readPackage(file, pkgPath, done) {
    if (file.isDirectory()) {
      const pkg = new Package(pkgPath);
      this.packages.push(pkg);
      pkg.activate();
      Action.packageActivated(pkg);
    }
    done();
  }
}

module.exports = PackageManager;
