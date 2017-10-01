const Reflux = require('reflux');

/**
 * The actions used by the database components.
 */
const Actions = Reflux.createActions([
  'sortCollections',
  'dropCollection',
  'createCollection',
  'openCreateCollectionDialog',
  'openDropCollectionDialog'
]);

module.exports = Actions;
