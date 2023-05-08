import React from 'react';
import { Provider } from 'react-redux';

import { store } from './stores/export-store';
import { ExportModal } from './components/export-modal';
import ExportInProgressModal from './components/export-in-progress-modal';

function ExportPlugin() {
  return (
    <Provider store={store}>
      <ExportModal />
      <ExportInProgressModal />
    </Provider>
  );
}

export default ExportPlugin;
