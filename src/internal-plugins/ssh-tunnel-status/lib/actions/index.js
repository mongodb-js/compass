const Reflux = require('reflux');

const SSHTunnelStatusAction = Reflux.createActions([
  /**
   * define your actions as strings below, for example:
   */
  'showFullHostPort',
  'showTruncatedHostPort'
]);

module.exports = SSHTunnelStatusAction;
