const CompassCrudComponent = require('./lib/components');
const CompassCrudActions = require('./lib/actions');
const CompassCrudStore = require('./lib/stores');

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'CompassCrud',
  component: CompassCrudComponent
};

/**
 * Activate all the components in the Compass Crud package.
 */
function activate(appRegistry) {
  // Register the CompassCrudComponent as a role in Compass
  //
  // Available roles are:
  //   - Instance.Tab
  //   - Database.Tab
  //   - Collection.Tab
  //   - CollectionHUD.Item
  //   - Header.Item

  appRegistry.registerRole('Collection.Tab', ROLE);
  appRegistry.registerAction('CompassCrud.Actions', CompassCrudActions);
  appRegistry.registerStore('CompassCrud.Store', CompassCrudStore);
}

/**
 * Deactivate all the components in the Compass Crud package.
 */
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Collection.Tab', ROLE);
  appRegistry.deregisterAction('CompassCrud.Actions');
  appRegistry.deregisterStore('CompassCrud.Store');
}

module.exports = CompassCrudComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
