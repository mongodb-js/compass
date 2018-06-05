import { createStore, applyMiddleware } from 'redux';
import { addInputQuery } from 'modules/export-query';
import thunk from 'redux-thunk';
import reducer from 'modules';

const store = createStore(reducer, applyMiddleware(thunk));

store.onActivated = (appRegistry) => {
  appRegistry.on('open-aggregation-export-to-language', (aggregation) => {
    store.dispatch(addInputQuery(aggregation));
  });

  appRegistry.on('open-query-export-to-language', (query) => {
    store.dispatch(addInputQuery(query));
  });
};

export default store;
