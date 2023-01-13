import React from 'react';
import { Provider } from 'react-redux';

import DropCollectionModal from './drop-collection-modal';
import store from '../stores/drop-collection';

function DropCollectionPlugin() {
  return (
    <Provider store={store}>
      <DropCollectionModal />
    </Provider>
  );
}

export default DropCollectionPlugin;
