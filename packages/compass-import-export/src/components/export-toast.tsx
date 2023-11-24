import React from 'react';
import { openToast, ToastBody } from '@mongodb-js/compass-components';
import path from 'path';

import revealFile from '../utils/reveal-file';
import type { CSVExportPhase } from '../export/export-csv';

const exportToastId = 'export-toast';

const docsWrittenText = (docsWritten: number) => {
  return `${docsWritten} document${docsWritten !== 1 ? 's' : ''} written.`;
};

export function showInProgressToast({
  filePath,
  namespace,
  cancelExport,
  docsWritten,
  csvPhase,
}: {
  filePath: string;
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
    title: `Exporting "${namespace}" to ${path.basename(filePath)}…`,
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
  filePath,
}: {
  docsWritten: number;
  filePath: string;
}) {
  openToast(exportToastId, {
    title: 'Export completed.',
    description: (
      <ToastBody
        statusMessage={docsWrittenText(docsWritten)}
        actionHandler={() => revealFile(filePath)}
        actionText="show file"
      />
    ),
    variant: 'success',
  });
}

export function showCancelledToast({
  docsWritten,
  filePath,
}: {
  filePath: string;
  docsWritten: number;
}) {
  openToast(exportToastId, {
    title: 'Export aborted.',
    description:
      docsWritten > 0 ? (
        <ToastBody
          statusMessage={docsWrittenText(docsWritten)}
          actionHandler={() => revealFile(filePath)}
          actionText="show file"
        />
      ) : null,
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
