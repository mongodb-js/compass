import React from 'react';
import { Provider } from 'react-redux';
import { withPreferences } from 'compass-preferences-model';

import ExportModal from './components/export-modal';
import exportStore from './stores/export-store';
import { store as newExportStore } from './stores/new-export-store';
import { ExportModal as NewExportModal } from './components/new-export-modal';
import ExportInProgressModal from './components/export-in-progress-modal';

function ExportPlugin({ useNewExport }: { useNewExport: boolean }) {
  // TODO(COMPASS-6580): Remove feature flag, use next export.
  if (useNewExport) {
    return (
      <Provider store={newExportStore}>
        <NewExportModal />
        <ExportInProgressModal />
      </Provider>
    );
  }

  return (
    <Provider store={exportStore}>
      <ExportModal />
    </Provider>
  );
}

export default withPreferences(ExportPlugin, ['useNewExport'], React);
