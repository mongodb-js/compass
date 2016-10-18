const Reflux = require('reflux');

/**
 * The actions used by the server stats components.
 */
const Actions = Reflux.createActions([
  'pollCurrentOp',
  'pollTop',
  'pollServerStats',
  'pause',
  'dbError',
  'showOperationDetails',
  'hideOperationDetails',
  'restart'
]);

module.exports = Actions;
