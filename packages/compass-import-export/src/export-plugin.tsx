import React from 'react';
import { ExportModal } from './components/export-modal';
import ExportInProgressModal from './components/export-in-progress-modal';
import { ExportCollectionsModal } from './components/export-collections-modal';

function ExportPlugin() {
  return (
    <>
      <ExportModal />
      <ExportInProgressModal />
      <ExportCollectionsModal />
    </>
  );
}

export default ExportPlugin;
