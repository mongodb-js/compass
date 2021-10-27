'use strict';

const { promises: fs } = require('fs');
const path = require('path');
const Plugin = require('./plugin');
const Action = require('./action');

const { createLoggerAndTelemetry } = require('@mongodb-js/compass-logging');
const { debug, track } = createLoggerAndTelemetry('COMPASS-PLUGINS');

/**
 * Manages plugins in the application.
 */
class PluginManager {
  /**
   * Instantiate the plugin manager.
   *
   * @param {string[]} paths - The paths to look for plugins in.
   * @param {string} baseDir - The base directory.
   * @param {Plugin[]} plugins - A list of individual plugins.
   */
  constructor(paths, baseDir, plugins = []) {
    this.paths = paths;
    this.baseDir = baseDir;
    this.plugins = [...plugins];
  }

  /**
   * Activate all the plugins.
   *
   * @param {AppRegistry} appRegistry - The app registry to pass when activating.
   * @param {String} apiVersion - The plugin API version.
   */
  async activate(appRegistry, apiVersion = '1.0.0') {
    await Promise.all(
      this.paths.map((pluginPath) =>
        this._loadPluginsFromPath(pluginPath, apiVersion)
      )
    );

    this.plugins.forEach(plugin => {
      plugin.activate(appRegistry);
      Object.freeze(plugin);
      Action.pluginActivated(plugin);
    });

    Action.pluginActivationCompleted(appRegistry);
  }

  async _loadPluginsFromPath(userPluginPath, appRegistry, apiVersion) {
    debug('Loading plugins from path', userPluginPath);
    try {
      const files = await fs.readdir(userPluginPath);
      return await Promise.all(
        files.map((basename) => {
          return this._loadPlugin(
            path.join(userPluginPath, basename),
            appRegistry,
            apiVersion
          );
        })
      );
    } catch (e) {
      debug('Failed to load plugins from path:', e);
    }
    return [];
  }

  async _loadPlugin(pluginPath, apiVersion) {
    debug('Loading plugin from path', pluginPath);
    track('External Plugin Loaded');
    try {
      const plugin = new Plugin(pluginPath, apiVersion);
      this.plugins.push(plugin);
      return plugin;
    } catch (e) {
      debug('Failed to load plugin:', e);
    }
    return null;
  }
}

module.exports = PluginManager;
