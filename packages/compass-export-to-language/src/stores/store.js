import { addInputQuery, togleModal, setNamespace, runQuery } from 'modules/export-query';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from 'modules';

const store = createStore(reducer, applyMiddleware(thunk));

store.onActivated = (appRegistry) => {
  appRegistry.on('open-aggregation-export-to-language', (aggregation) => {
    store.dispatch(togleModal(true));
    store.dispatch(setNamespace('Pipeline'));
    store.dispatch(runQuery('python', aggregation));
    store.dispatch(addInputQuery(aggregation));
  });

  appRegistry.on('open-query-export-to-language', (query) => {
    store.dispatch(togleModal(true));
    store.dispatch(setNamespace('Query'));
    store.dispatch(runQuery('python', query));
    store.dispatch(addInputQuery(query));
  });
};

export default store;
