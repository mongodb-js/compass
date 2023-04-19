import React from 'react';
import { Provider } from 'react-redux';
import { withPreferences } from 'compass-preferences-model';

import LegacyExportModal from './components/legacy/export-modal';
import exportStore from './stores/legacy-export-store';
import { store as newExportStore } from './stores/export-store';
import { ExportModal } from './components/export-modal';
import ExportInProgressModal from './components/export-in-progress-modal';

function ExportPlugin({ useNewExport }: { useNewExport: boolean }) {
  // TODO(COMPASS-6580): Remove feature flag, use next export.
  if (useNewExport) {
    return (
      <Provider store={newExportStore}>
        <ExportModal />
        <ExportInProgressModal />
      </Provider>
    );
  }
  return (
    <Provider store={exportStore}>
      <LegacyExportModal />
    </Provider>
  );
}

export default withPreferences(ExportPlugin, ['useNewExport'], React);
