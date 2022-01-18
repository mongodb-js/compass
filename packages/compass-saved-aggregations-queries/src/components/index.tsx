import React from 'react';
import AggregationsQueriesList from './aggregations-queries-list';
import { Provider } from 'react-redux';
import store from '../stores/index';

const WithStore: React.FunctionComponent = () => {
  return (
    // The way Compass requires to extend redux store is not compatible with
    // redux types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Provider store={store as any}>
      <AggregationsQueriesList></AggregationsQueriesList>
    </Provider>
  );
};

export default WithStore;
