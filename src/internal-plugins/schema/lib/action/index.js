const Reflux = require('reflux');

const SchemaAction = Reflux.createActions({
  /**
   * starts schema sampling with the current query
   */
  startSampling: {sync: true},
  /**
   * stops schema sampling
   */
  stopSampling: {sync: true},
  /**
   * Reset store
   */
  reset: {sync: true},
  /**
   * set new maxTimeMS value
   */
  setMaxTimeMS: {sync: true},
  /**
   * reset maxTimeMS value to default
   */
  resetMaxTimeMS: {sync: true},
  /**
   * Resize the minicharts.
   */
  resizeMiniCharts: {sync: true}
});

module.exports = SchemaAction;
