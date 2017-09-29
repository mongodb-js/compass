const semver = require('semver');
const path = require('path');
const addChartsCommands = require('./packages/spectron-charts');
const addCollectionCommands = require('./packages/spectron-collection');
const addCollectionDDLCommands = require('./packages/spectron-collection-ddl');
const addConnectCommands = require('./packages/spectron-connect');
const addCRUDCommands = require('./packages/spectron-crud');
const addDatabaseCommands = require('./packages/spectron-database');
const addDatabaseDDLCommands = require('./packages/spectron-database-ddl');
const addExplainCommands = require('./packages/spectron-explain');
const addFeatureTourCommands = require('./packages/spectron-feature-tour');
const addHomeCommands = require('./packages/spectron-home');
const addIndexesCommands = require('./packages/spectron-indexes');
const addInstanceHeaderCommands = require('./packages/spectron-instance-header');
const addKeyPressCommands = require('./packages/spectron-keypress');
const addModalCommands = require('./packages/spectron-modal');
const addPrivacyCommands = require('./packages/spectron-privacy');
const addQueryCommands = require('./packages/spectron-query');
const addSchemaCommands = require('./packages/spectron-schema');
const addServerVersionCommands = require('./packages/spectron-server-version');
const addSidebarCommands = require('./packages/spectron-sidebar');
const addStatusBarCommands = require('./packages/spectron-status-bar');
const addWorkflowCommands = require('./packages/spectron-workflow');
const { App } = require('hadron-spectron');

/**
 * The root Compass dir.
 */
const ROOT = path.join(__dirname, '..', '..', '..');

function addCommands(client) {
  addChartsCommands(client);
  addCollectionCommands(client);
  addCollectionDDLCommands(client);
  addConnectCommands(client);
  addCRUDCommands(client);
  addDatabaseCommands(client);
  addDatabaseDDLCommands(client);
  addExplainCommands(client);
  addFeatureTourCommands(client);
  addHomeCommands(client);
  addIndexesCommands(client);
  addInstanceHeaderCommands(client);
  addKeyPressCommands(client);
  addModalCommands(client);
  addPrivacyCommands(client);
  addQueryCommands(client);
  addSchemaCommands(client);
  addSidebarCommands(client);
  addServerVersionCommands(client);
  addStatusBarCommands(client);
  addWorkflowCommands(client);
}

/**
 * Call launchCompass in beforeEach for all UI tests:
 *
 * @returns {Promise} Promise that resolves when app starts.
 */
function launchCompass() {
  return new App(ROOT).launch(addCommands);
}

/**
 * Call quitCompass in afterEach for all UI tests:

 * @param {Object} app - The running application
 *
 * @returns {Promise}    Promise that resolves when app stops or is undefined.
 */
function quitCompass(app) {
  if (app === undefined || app === null) {
    return Promise.resolve();
  }
  return app.quit();
}

/**
 * Determine if index usage is enabled in the server version.
 *
 * @param {String} version - The server version.
 *
 * @returns {Boolean} If index usage is available.
 */
function isIndexUsageEnabled(version) {
  return semver.gte(version, '3.2.0');
}

module.exports.launchCompass = launchCompass;
module.exports.quitCompass = quitCompass;
module.exports.isIndexUsageEnabled = isIndexUsageEnabled;
