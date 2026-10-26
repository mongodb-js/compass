import path from 'node:path';
import React from 'react';
import { openToast, ToastBody } from '@mongodb-js/compass-components';
import type { CSVExportPhase } from '../export/export-csv';

const exportToastId = 'export-toast';

const docsWrittenText = (docsWritten: number) => {
  return `${docsWritten} document${docsWritten !== 1 ? 's' : ''} written.`;
};

export function showInProgressToast({
  fileName,
  namespace,
  cancelExport,
  docsWritten,
  csvPhase,
}: {
  fileName: string;
  namespace: string;
  cancelExport: () => void;
  docsWritten: number;
  csvPhase?: CSVExportPhase;
}) {
  let statusMessage = docsWrittenText(docsWritten);

  if (csvPhase === 'DOWNLOAD') {
    statusMessage = `Processing documents before exporting, ${docsWritten} document${
      docsWritten !== 1 ? 's' : ''
    } processed.`;
  }

  // Update the toast with the new progress.
  openToast(exportToastId, {
    title: `Exporting "${namespace}" to ${fileName}\u2026`,
    description: (
      <ToastBody
        statusMessage={statusMessage}
        actionHandler={cancelExport}
        actionText="stop"
      />
    ),
    progress: undefined, // Don't show progress as there is no total document count.
    variant: 'progress',
    dismissible: false,
  });
}

export function showStartingToast({
  namespace,
  cancelExport,
}: {
  namespace: string;
  cancelExport: () => void;
}) {
  openToast(exportToastId, {
    title: `Exporting "${namespace}"…`,
    description: (
      <ToastBody
        statusMessage="Starting…"
        actionHandler={cancelExport}
        actionText="stop"
      />
    ),
    variant: 'progress',
    dismissible: false,
  });
}

export function showCompletedToast({
  docsWritten,
  fileName,
}: {
  docsWritten: number;
  fileName: string;
}) {
  openToast(exportToastId, {
    title: 'Export completed.',
    description: `${docsWrittenText(docsWritten)} Saved to ${fileName}.`,
    variant: 'success',
  });
}

export function showCancelledToast() {
  openToast(exportToastId, {
    title: 'Export aborted.',
    description: null,
    variant: 'warning',
  });
}

export function showFailedToast(err: Error | undefined) {
  openToast(exportToastId, {
    title: 'Failed to export with the following error:',
    description: err?.message,
    variant: 'warning',
  });
}
