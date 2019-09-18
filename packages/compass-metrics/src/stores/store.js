import { createStore } from 'redux';
import reducer from 'modules';
import rules from 'modules/rules';
import setup from 'modules/setup';

const metricsStore = createStore(reducer);
const metrics = require('mongodb-js-metrics')();

/**
 * Legacy tracking for Reflux store updates.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 * @param {String} storeName - The store name.
 * @param {Object} rule - The rule.
 * @param {String} version - The compass version.
 */
const trackStoreUpdate = (appRegistry, storeName, rule, version) => {
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
          metrics.track(rule.resource, rule.action, rule.metadata(version, s));
        });
      } else {
        metrics.track(rule.resource, rule.action, rule.metadata(version, state));
      }
    }
  });
};

/**
 * Tracking of events that are emitted on the app registry.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 * @param {String} eventName - The name of the event.
 * @param {Object} rule - The rule.
 * @param {String} version - The compass version.
 */
const trackRegistryEvent = (appRegistry, eventName, rule, version) => {
  // attach an event listener
  appRegistry.on(eventName, (...args) => {
    // only track an event if the rule condition evaluates to true
    if (rule.condition(...args)) {
      metrics.track(rule.resource, rule.action, rule.metadata(version, ...args));
    }
  });
};

/**
 * When the app registry is activated setup the store.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 */
metricsStore.onActivated = (appRegistry) => {
  appRegistry.on('application-initialized', (version, productName) => {
    setup(appRegistry, productName, version);

    // configure rules
    rules.forEach((rule) => {
      // get the store for this rule
      const storeName = rule.store;
      const eventName = rule.registryEvent;

      if (storeName) {
        trackStoreUpdate(appRegistry, storeName, rule, version);
      } else if (eventName) {
        trackRegistryEvent(appRegistry, eventName, rule, version);
      }
    });
  });
};

export default metricsStore;
export { trackStoreUpdate, trackRegistryEvent };
