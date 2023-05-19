import _ from 'lodash';
import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { track } = createLoggerAndTelemetry('COMPASS-QUERY-HISTORY-UI');

// Why is this separate store.

/**
 * Query History Favorites List store.
 */
const configureStore = (options = {}) => {
  const store = Reflux.createStore({
    mixins: [StateMixin.store],

    listenables: options.actions,


  store.state.items.fetch({
    success: () => {
      store.trigger(store.state);
    },
  });

  if (options.localAppRegistry) {
    store.localAppRegistry = options.localAppRegistry;
  }

  return store;
};

export default configureStore;
