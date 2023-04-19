import React from 'react';
import { openToast } from '@mongodb-js/compass-components';
import path from 'path';

import { ToastBody } from './toast-body';
import revealFile from '../utils/reveal-file';

const exportToastId = 'export-toast';

export function showInProgressToast({
  filePath,
  namespace,
  cancelExport,
  docsWritten,
}: {
  filePath: string;
  namespace: string;
  cancelExport: () => void;
  docsWritten: number;
}) {
  // Update the toast with the new progress.
  openToast(exportToastId, {
    title: `Export ${namespace} to ${path.basename(filePath)}…`,
    body: (
      <ToastBody
        statusMessage={`${docsWritten} document${
          docsWritten !== 1 ? 's' : ''
        } written.`}
        actionHandler={cancelExport}
        actionText="stop"
      />
    ),
    progress: undefined, // Don't show progress as we don't have the count of the documents.
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
    title: `Exporting ${namespace}…`,
    body: (
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
    body: (
      <ToastBody
        statusMessage={`${docsWritten} document${
          docsWritten !== 1 ? 's' : ''
        } written.`}
        actionHandler={() => revealFile(filePath)}
        actionText="show file"
      />
    ),
    variant: 'success',
  });
}

export function showCancelledToast() {
  openToast(exportToastId, {
    title: 'Export aborted.',
    body: <></>,
    variant: 'warning',
  });
}

export function showFailedToast(err: Error | undefined) {
  openToast(exportToastId, {
    title: 'Failed to export with the following error:',
    body: err?.message,
    variant: 'warning',
  });
}
