
/**
 * Query History Recent List store.
 */
const configureStore = (options = {}) => {

  store.onConnected();

  if (options.localAppRegistry) {
    store.localAppRegistry = options.localAppRegistry;
    options.localAppRegistry.on('query-applied', (query) => {
      store.onQueryApplied(query);
    });
  }

  return store;
};

export default configureStore;
