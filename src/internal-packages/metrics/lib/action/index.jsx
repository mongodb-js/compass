const Reflux = require('reflux');

const MetricsAction = Reflux.createActions([
  /**
   * fetches the metrics documents via a simple `find` on the current collection.
   */
  'fetchMetrics'
]);

module.exports = MetricsAction;
