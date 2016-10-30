const Reflux = require('reflux');

/**
 * The actions used by the server stats components.
 */
const Actions = Reflux.createActions([
  'sortDatabases',
  'deleteDatabase',
  'createDatabaseWithCollection'
]);

module.exports = Actions;
