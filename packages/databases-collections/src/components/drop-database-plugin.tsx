import React from 'react';
import { Provider } from 'react-redux';

import DropDatabaseModal from './drop-database-modal';
import store from '../stores/drop-database';

function DropDatabasePlugin() {
  return (
    <Provider store={store}>
      <DropDatabaseModal />
    </Provider>
  );
}

export default DropDatabasePlugin;
