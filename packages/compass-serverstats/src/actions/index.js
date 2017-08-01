const Reflux = require('reflux');

/**
 * The actions used by the server stats components.
 */
const Actions = Reflux.createActions([
  'pause',
  'dbError',
  'showOperationDetails',
  'hideOperationDetails',
  'restart',
  'mouseOut',
  'currentOp',
  'serverStats',
  'top',
  { mouseOver: { sync: true }}
]);

module.exports = Actions;
