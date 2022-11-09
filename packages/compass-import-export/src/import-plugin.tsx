import React from 'react';
import { Provider } from 'react-redux';
import ImportModal from './components/import-modal';
import importStore from './stores/import-store';

function ImportPlugin() {
  return (
    <Provider store={importStore}>
      <ImportModal />
    </Provider>
  );
}

export default ImportPlugin;
