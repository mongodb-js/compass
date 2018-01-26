const Reflux = require('reflux');
const metrics = require('mongodb-js-metrics')();
const setupMetrics = require('./setup');
const rules = require('./rules');

const MetricsStore = Reflux.createStore({

  /**
   * When all plugins are activated, start registering event listeners to
   * stores for metrics tracking according to the rules specified in ./rules.js.
   *
   * @param  {Object} appRegistry   the app registry
   */
  onActivated(appRegistry) {
    // set up listeners on external stores
    if (process.env.HADRON_LOCKDOWN !== 'true') {
      setupMetrics();

      // configure rules
      rules.forEach((rule) => {
        // get the store for this rule
        const storeName = rule.store;
        const eventName = rule.registryEvent;

        if (storeName) {
          this.trackStoreUpdate(appRegistry, storeName, rule);
        } else if (eventName) {
          this.trackRegistryEvent(appRegistry, eventName, rule);
        }
      });
    }
  },

  trackStoreUpdate(appRegistry, storeName, rule) {
    const store = appRegistry.getStore(storeName);
    if (!store) {
      return;
    }
    // attach an event listener
    store.listen((state) => {
      // only track an event if the rule condition evaluates to true
      if (rule.condition(state)) {
        // Some stores trigger with arrays of data.
        if (rule.multi) {
          state.forEach((s) => {
            metrics.track(rule.resource, rule.action, rule.metadata(s));
          });
        } else {
          metrics.track(rule.resource, rule.action, rule.metadata(state));
        }
      }
    });
  },

  trackRegistryEvent(appRegistry, eventName, rule) {
    // attach an event listener
    appRegistry.on(eventName, (...args) => {
      // only track an event if the rule condition evaluates to true
      if (rule.condition(...args)) {
        metrics.track(rule.resource, rule.action, rule.metadata(...args));
      }
    });
  }
});

module.exports = MetricsStore;
