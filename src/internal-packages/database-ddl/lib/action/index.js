const Reflux = require('reflux');

/**
 * The actions used by the DDL components.
 */
const Actions = Reflux.createActions([
  'sortDatabases',
  'createDatabase',
  'dropDatabase',
  'openCreateDatabaseDialog',
  'openDropDatabaseDialog'
]);

module.exports = Actions;
