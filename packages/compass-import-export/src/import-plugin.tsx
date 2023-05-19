import React from 'react';
import { Provider } from 'react-redux';

import ImportModal from './components/import-modal';
import ImportInProgressModal from './components/import-in-progress-modal';
import { store as importStore } from './stores/import-store';

function ImportPlugin() {
  return (
    <Provider store={importStore}>
      <ImportModal />
      <ImportInProgressModal />
    </Provider>
  );
}

export default ImportPlugin;
