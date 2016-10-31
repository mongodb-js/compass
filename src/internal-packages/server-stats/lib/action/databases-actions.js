const Reflux = require('reflux');

/**
 * The actions used by the database components.
 */
const Actions = Reflux.createActions([
  'sortDatabases',
  'deleteDatabase',
  'createDatabase',
  'openCreateDatabaseDialog'
]);

module.exports = Actions;
