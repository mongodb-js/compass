'use strict';

const async = require('async');
const fs = require('fs');
const path = require('path');
const Plugin = require('./plugin');
const Action = require('./action');

/**
 * Manages plugins in the application.
 */
class PluginManager {

  /**
   * Instantiate the plugin manager.
   *
   * @param {String} paths - The paths to look for plugins in.
   * @param {String} baseDir - The base directory.
   * @param {Array} pluginList - A list of individual plugins.
   */
  constructor(paths, baseDir, pluginList) {
    this.paths = paths;
    this.baseDir = baseDir;
    this.pluginList = pluginList;
    this.plugins = [];
  }

  /**
   * Activate all the plugins.
   *
   * @param {AppRegistry} appRegistry - The app registry to pass when activating.
   * @param {String} apiVersion - The plugin API version.
   */
  activate(appRegistry, apiVersion = '1.0.0') {
    async.series([
      this._loadPluginsFromPaths.bind(this, appRegistry, apiVersion),
      this._loadPluginList.bind(this, appRegistry, apiVersion)
    ], () => {
      Action.pluginActivationCompleted(appRegistry);
    });
  }

  _loadPluginsFromPaths(appRegistry, apiVersion, done) {
    async.each(this.paths, (pkgPath, d) => {
      this._loadPath(appRegistry, apiVersion, pkgPath, d);
    }, () => {
      done();
    });
  }

  _loadPluginList(appRegistry, apiVersion, done) {
    async.each(this.pluginList, (pkgPath, d) => {
      this._loadPlugin(appRegistry, apiVersion, this.baseDir, pkgPath, d);
    }, () => {
      done();
    });
  }

  _loadPath(appRegistry, apiVersion, pkgPath, done) {
    fs.readdir(pkgPath, (error, files) => {
      if (error) {
        done();
      } else {
        async.each(files, (file, d) => {
          this._loadPlugin(appRegistry, apiVersion, pkgPath, file, d);
        }, () => {
          done();
        });
      }
    });
  }

  _loadPlugin(appRegistry, apiVersion, pkgPath, file, done) {
    const pluginPath = path.join(pkgPath, file);
    fs.stat(pluginPath, (error, f) => {
      if (error) {
        return done();
      }
      this._readPlugin(appRegistry, apiVersion, f, pluginPath, done);
    });
  }

  _readPlugin(appRegistry, apiVersion, file, pkgPath, done) {
    if (file.isDirectory()) {
      const pkg = new Plugin(pkgPath, apiVersion);
      this.plugins.push(pkg);
      pkg.activate(appRegistry);
      Action.pluginActivated(pkg);
    }
    done();
  }
}

module.exports = PluginManager;
