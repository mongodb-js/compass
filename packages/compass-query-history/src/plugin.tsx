import React from 'react';
import { Provider } from 'react-redux';

import QueryHistory from './components/query-history';
import type { configureStore } from './stores/query-history-store';

function QueryHistoryPlugin({
  store,
}: {
  store: ReturnType<Awaited<typeof configureStore>>;
}) {
  return (
    <Provider store={store}>
      <QueryHistory />
    </Provider>
  );
}

export { QueryHistoryPlugin };
