const Reflux = require('reflux');

const SSHTunnelStatusActions = Reflux.createActions([
  /**
   * define your actions as strings below, for example:
   */
  'showFullHostPort',
  'showTruncatedHostPort'
]);

module.exports = SSHTunnelStatusActions;
