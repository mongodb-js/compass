import React from 'react';
import { Provider } from 'react-redux';
import ExportModal from './components/export-modal';
import exportStore from './stores/export-store';

function ExportPlugin() {
  return (
    <Provider store={exportStore}>
      <ExportModal />
    </Provider>
  );
}

export default ExportPlugin;
