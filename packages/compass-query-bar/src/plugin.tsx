import React from 'react';
import { Provider } from 'react-redux';
import type configureStore from './stores';
import QueryBar from './components/query-bar';

type QueryBarPluginProps = {
  store: ReturnType<typeof configureStore>;
} & React.ComponentProps<typeof QueryBar>;

const QueryBarPlugin: React.FunctionComponent<QueryBarPluginProps> = ({
  store,
  ...props
}) => {
  return (
    <Provider store={store}>
      <QueryBar {...props} />
    </Provider>
  );
};

export default QueryBarPlugin;
export { QueryBarPlugin as Plugin };
