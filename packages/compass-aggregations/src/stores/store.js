import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from 'modules';
import { namespaceChanged } from 'modules/namespace';
import { fieldsChanged } from 'modules/fields';

/**
 * The store has a combined pipeline reducer plus the thunk middleware.
 */
const store = createStore(reducer, applyMiddleware(thunk));

/**
 * This hook is Compass specific to listen to app registry events.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 */
store.onActivated = (appRegistry) => {
  /**
   * When the collection is changed, update the store.
   *
   * @param {String} ns - The full namespace.
   */
  appRegistry.on('collection-changed', (ns) => {
    store.dispatch(namespaceChanged(ns));
  });

  /**
   * When the schema fields change, update the state with the new
   * fields.
   *
   * @param {Object} fields - The fields.
   */
  appRegistry.getStore('Field.Store').listen((fields) => {
    store.dispatch(fieldsChanged(fields.fields));
  });
};

export default store;
