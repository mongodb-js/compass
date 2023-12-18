import React from 'react';
import { ExportModal } from './components/export-modal';
import ExportInProgressModal from './components/export-in-progress-modal';

function ExportPlugin() {
  return (
    <>
      <ExportModal />
      <ExportInProgressModal />
    </>
  );
}

export default ExportPlugin;
