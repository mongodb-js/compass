const Reflux = require('reflux');

const SchemaActions = Reflux.createActions({
  /**
   * starts schema sampling with the current query
   */
  startSampling: {sync: true},
  /**
   * stops schema sampling
   */
  stopSampling: {sync: true},
  /**
   * set new maxTimeMS value
   */
  setMaxTimeMS: {sync: true},
  /**
   * reset maxTimeMS value to default
   */
  resetMaxTimeMS: {sync: true}
});

module.exports = SchemaActions;
