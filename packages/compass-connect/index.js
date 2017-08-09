const MongodbJsCompassConnectComponent = require('./lib/components');
const MongodbJsCompassConnectActions = require('./lib/actions');
const MongodbJsCompassConnectStore = require('./lib/stores');

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'MongodbJsCompassConnect',
  component: MongodbJsCompassConnectComponent
};

/**
 * Activate all the components in the  Mongodb Js Compass Connect package.
 */
function activate(appRegistry) {
  // Register the MongodbJsCompassConnectComponent as a role in Compass
  //
  // Available roles are:
  //   - Instance.Tab
  //   - Database.Tab
  //   - Collection.Tab
  //   - CollectionHUD.Item
  //   - Header.Item

  appRegistry.registerRole('Application.Connect', ROLE);
  appRegistry.registerAction('MongodbJsCompassConnect.Actions', MongodbJsCompassConnectActions);
  appRegistry.registerStore('MongodbJsCompassConnect.Store', MongodbJsCompassConnectStore);
}

/**
 * Deactivate all the components in the  Mongodb Js Compass Connect package.
 */
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Application.Connect', ROLE);
  appRegistry.deregisterAction('MongodbJsCompassConnect.Actions');
  appRegistry.deregisterStore('MongodbJsCompassConnect.Store');
}

module.exports = MongodbJsCompassConnectComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
