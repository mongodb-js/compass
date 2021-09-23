'use strict';

const path = require('path');
const semver = require('semver');
const req = require('./require');

/**
 * The plugin module cache.
 */
const CACHE = {};

/**
 * The plugin name cache.
 */
const NAME_CACHE = {};

/**
 * Plugin version message.
 */
const PLUGIN_VERSION = "This plugin's api version of";

/**
 * Not compatible message.
 */
const NOT_COMPATIBLE = 'is not compatible with the application plugin api version of';

/**
 * Define the filename constant.
 */
const PLUGIN_FILENAME = 'package.json';

/**
 * The ext path.
 */
const EXT_PATH = '.mongodb';

/**
 * The org name.
 */
const MDBJS = '@mongodb-js';

/**
 * Represents a plugin to the application.
 */
class Plugin {
  /**
   * Instantiate the plugin.
   *
   * @param {String} pluginPath - The path to the plugin.
   * @param {String} applicationApiVersion - The plugin API version of the application.
   */
  constructor(pluginPath, applicationApiVersion = '1.0.0') {
    this.pluginPath = pluginPath;
    this.isActivated = false;
    try {
      this.metadata = Object.freeze(req(path.resolve(this.pluginPath, PLUGIN_FILENAME)));
    } catch (e) {
      this.error = Object.freeze(e);
      this.metadata = Object.freeze({ name: `${path.basename(this.pluginPath)}` });
    }
    this._validateNameLegality();
    this._validateApiVersion(applicationApiVersion);
    this._validateNameCollision();
  }

  /**
   * Load the plugin. Will happen only once and subsequently will be pulled
   * from the cache.
   *
   * @returns {module} The loaded module.
   */
  load() {
    if (CACHE.hasOwnProperty(this.pluginPath)) {
      return CACHE[this.pluginPath];
    }
    const module = req(path.resolve(this.pluginPath, this.metadata.main));
    CACHE[this.pluginPath] = module;
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

  _validateApiVersion(applicationApiVersion) {
    this.applicationApiVersion = applicationApiVersion;
    this.apiVersion = this.metadata.apiVersion || applicationApiVersion;
    if (!semver.satisfies(this.applicationApiVersion, `^${this.apiVersion}`)) {
      this.error = new Error(
        `${PLUGIN_VERSION} ${this.apiVersion} ${NOT_COMPATIBLE} ${this.applicationApiVersion}`
      );
    }
  }

  _validateNameLegality() {
    const name = this.metadata.name;
    if (this.pluginPath.includes(EXT_PATH) && name.startsWith(MDBJS)) {
      this.error = new Error(`Plugin name starting with ${MDBJS} is not permitted.`);
      this.error.stack = '';
    }
  }

  _validateNameCollision() {
    const name = this.metadata.name;
    if (NAME_CACHE.hasOwnProperty(name)) {
      this.error = new Error(`Plugin with the name ${name} already exists.`);
    } else {
      NAME_CACHE[name] = this.pluginPath;
    }
  }
}

module.exports = Plugin;
module.exports.CACHE = CACHE;
module.exports.NAME_CACHE = NAME_CACHE;
