const Reflux = require('reflux');

/**
 * The actions used by the server stats components.
 */
const Actions = Reflux.createActions([
  'sortCollections',
  'deleteCollection',
  'createCollection'
]);

module.exports = Actions;
