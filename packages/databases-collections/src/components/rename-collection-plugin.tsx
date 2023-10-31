import React from 'react';
import { Provider } from 'react-redux';

import store from '../stores/rename-collection';
import RenameCollectionModal from './rename-collection-modal';

function RenameCollectionPlugin() {
  return (
    <Provider store={store}>
      <RenameCollectionModal />
    </Provider>
  );
}

export default RenameCollectionPlugin;
