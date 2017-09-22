'use strict';

const path = require('path');

/**
 * The plugin cache.
 */
const Cache = {};

/**
 * Define the filename constant.
 */
const PLUGIN_FILENAME = 'package.json';

/**
 * Represents a plugin to the application.
 */
class Plugin {

  /**
   * Instantiate the plugin.
   *
   * @param {string} pluginPath - The path to the plugin.
   */
  constructor(pluginPath) {
    this.pluginPath = pluginPath;
    this.isActivated = false;
    try {
      this.metadata = require(path.resolve(this.pluginPath, PLUGIN_FILENAME));
    } catch (e) {
      this.error = e;
      this.metadata = { name: `${path.basename(this.pluginPath)}` };
    }
  }

  /**
   * Load the plugin. Will happen only once and subsequently will be pulled
   * from the cache.
   *
   * @returns {module} The loaded module.
   */
  load() {
    if (Cache.hasOwnProperty(this.pluginPath)) {
      return Cache[this.pluginPath];
    }
    const module = require(path.resolve(this.pluginPath, this.metadata.main));
    Cache[this.pluginPath] = module;
    return module;
  }

  /**
   * Activate the plugin. If the plugin has not yet been loaded, this method
   * will ensure it.
   *
   * @param {AppRegistry} appRegistry - The app registry.
   *
   * @returns {Object} The return value of the activate function in the module.
   */
  activate(appRegistry) {
    if (!this.error) {
      try {
        // @todo: Durran: COMPASS-2069: App registry needs to know the name of this
        //   plugin when activating it.
        const value = this.load().activate(appRegistry);
        this.isActivated = true;
        return value;
      } catch (e) {
        this.error = e;
      }
    }
  }
}

module.exports = Plugin;
module.exports.Cache = Cache;
