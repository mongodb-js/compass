import React from 'react';
import { Provider } from 'react-redux';

import ImportModal from './components/import-modal';
import InProgressModal from './components/in-progress-modal';
import importStore from './stores/import-store';

function ImportPlugin() {
  return (
    <Provider store={importStore}>
      <ImportModal />
      <InProgressModal />
    </Provider>
  );
}

export default ImportPlugin;
