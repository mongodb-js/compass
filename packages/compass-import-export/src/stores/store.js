import { createStore } from 'redux';
import reducer from 'modules';
import { nsChanged } from 'modules/ns';

/**
 * The store has a combined reducer.
 */
const store = createStore(reducer);

/**
 * Called when the app registry is activated.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 */
store.onActivated = (appRegistry) => {
  appRegistry.on('collection-changed', nsChanged);
};

export default store;
