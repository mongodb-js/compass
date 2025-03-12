import React from 'react';
import ImportModal from './components/import-modal';
import ImportInProgressModal from './components/import-in-progress-modal';
import ImportErrorDetailsModal from './components/import-error-details-modal';

function ImportPlugin() {
  return (
    <>
      <ImportModal />
      <ImportInProgressModal />
      <ImportErrorDetailsModal />
    </>
  );
}

export default ImportPlugin;
