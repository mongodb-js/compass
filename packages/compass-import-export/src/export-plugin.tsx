import React from 'react';
import { Provider } from 'react-redux';
import ExportModal from './components/legacy/export-modal';
import exportStore from './stores/legacy-export-store';

function ExportPlugin() {
  return (
    <Provider store={exportStore}>
      <ExportModal />
    </Provider>
  );
}

export default ExportPlugin;
