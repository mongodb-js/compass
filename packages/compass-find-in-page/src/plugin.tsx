import React from 'react';
import { Provider } from 'react-redux';

import CompassFindInPage from './components/compass-find-in-page';
import store from './stores';

const CompassFindInPagePlugin: React.FunctionComponent = () => {
  return (
    <Provider store={store}>
      <CompassFindInPage />
    </Provider>
  );
};

export default CompassFindInPagePlugin;
