'use strict';

const async = require('async');
const fs = require('fs');
const path = require('path');
const pkgUp = require('pkg-up');
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

  _loadPlugin(appRegistry, apiVersion, pkgPath, pluginNameOrPath, done) {
    let pluginPath;
    try {
      pluginPath = path.dirname(
        pkgUp.sync({ cwd: require.resolve(pluginNameOrPath) })
      );
    } catch (e) {
      pluginPath = path.join(pkgPath, pluginNameOrPath);
    }
    fs.stat(pluginPath, (error, stats) => {
      if (error) {
        return done();
      }
      this._readPlugin(appRegistry, apiVersion, stats, pluginPath, done);
    });
  }

  _readPlugin(appRegistry, apiVersion, stats, resolvedPath, done) {
    if (stats.isDirectory() || stats.isFile()) {
      const plugin = new Plugin(resolvedPath, apiVersion, stats);
      plugin.activate(appRegistry);
      const frozen = Object.freeze(plugin);
      this.plugins.push(frozen);
      Action.pluginActivated(frozen);
    }
    done();
  }
}

module.exports = PluginManager;
