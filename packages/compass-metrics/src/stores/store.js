import { createStore } from 'redux';
import reducer from 'modules';
import rules from 'modules/rules';
import setup from 'modules/setup';

const metricsStore = createStore(reducer);
const metrics = require('mongodb-js-metrics')();

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
  appRegistry.on(eventName, async(...args) => {
    // only track an event if the rule condition evaluates to true
    if (rule.condition(...args)) {
      metrics.track(rule.resource, rule.action, await rule.metadata(version, ...args));
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
      const eventName = rule.registryEvent;
      trackRegistryEvent(appRegistry, eventName, rule, version);
    });
  });
};

export default metricsStore;
