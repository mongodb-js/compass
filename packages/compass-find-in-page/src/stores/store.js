import reducer, { toggleStatus, setSearchTerm } from 'modules';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import ipc from 'hadron-ipc';

const store = createStore(reducer, applyMiddleware(thunk));

// cmd-f in main app emits an ipc event to find results
store.onActivated = (appRegistry) => {
  appRegistry.on('find', () => {
    if (store.getState().enabled) {
      ipc.call('app:stop-find-in-page', 'clearSelection');
      store.dispatch(setSearchTerm(''));
      store.dispatch(toggleStatus());
    }
  });

  // TODO: ideally the found-in-page result would send information about
  // results we could display to the user.  unfortunately passing 'results' via
  // ipc messes up original result navigation.
  // ipc.on('app:find-in-page-results', (sender, results) => {
  //   store.dispatch(setCurrentResult(results.activeMatchOrdinal));
  //   store.dispatch(setTotalResults(results.matches));
  // })
};

export default store;
