import React, { Component } from 'react';
import { Provider } from 'react-redux';

import CompassFindInPage from './components/compass-find-in-page';
import store from './stores';

const CompassFindInPagePlugin: React.FunctionComponent = () => {
  return (
    // The way Compass requires to extend redux store is not compatible with
    // redux types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Provider store={store}>
      <CompassFindInPage />
    </Provider>
  );
}

export default CompassFindInPagePlugin;
