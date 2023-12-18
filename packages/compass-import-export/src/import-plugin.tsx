import React from 'react';
import ImportModal from './components/import-modal';
import ImportInProgressModal from './components/import-in-progress-modal';

function ImportPlugin() {
  return (
    <>
      <ImportModal />
      <ImportInProgressModal />
    </>
  );
}

export default ImportPlugin;
