const Reflux = require('reflux');
const metrics = require('mongodb-js-metrics')();
const setupMetrics = require('./setup');
const rules = require('./rules');
// const debug = require('debug')('mongodb-compass:stores:metrics');

const MetricsStore = Reflux.createStore({

  /**
   * When all plugins are activated, start registering event listeners to
   * stores for metrics tracking according to the rules specified in ./rules.js.
   *
   * @param  {Object} appRegistry   the app registry
   */
  onActivated(appRegistry) {
    // set up listeners on external stores
    setupMetrics();

    // configure rules
    rules.forEach((rule) => {
      // get the store for this rule
      const store = appRegistry.getStore(rule.store);
      if (!store) {
        return;
      }
      // attach an event listener
      store.listen((state) => {
        // only track an event if the rule condition evaluates to true
        if (rule.condition(state)) {
          metrics.track(rule.resource, rule.action, rule.metadata(state));
        }
      });
    });
  }
});

module.exports = MetricsStore;
