import React from 'react';
import { openToast } from '@mongodb-js/compass-components';
import path from 'path';

import { ImportToastBody } from './import-toast-body';
import { openFile } from '../utils/open-file';

const importToastId = 'import-toast';
const toastMessageCharacterLimit = 200;

export function showInProgressToast({
  fileName,
  cancelImport,
  docsWritten,
  bytesProcessed,
  bytesTotal,
}: {
  fileName: string;
  cancelImport: () => void;
  docsWritten: number;
  bytesProcessed: number;
  bytesTotal: number;
}) {
  // Update the toast with the new progress.
  const progress = bytesTotal ? bytesProcessed / bytesTotal : undefined;
  openToast(importToastId, {
    title: `Importing ${path.basename(fileName)}…`,
    body: (
      <ImportToastBody
        statusMessage={`${docsWritten} document${
          docsWritten !== 1 ? 's' : ''
        } written.`}
        actionHandler={cancelImport}
        actionText="stop"
      />
    ),
    progress,
    variant: 'progress',
    dismissible: false,
  });
}

export function showStartingToast({
  fileName,
  cancelImport,
}: {
  fileName: string;
  cancelImport: () => void;
}) {
  openToast(importToastId, {
    title: `Importing ${path.basename(fileName)}…`,
    body: (
      <ImportToastBody
        statusMessage="Starting…"
        actionHandler={cancelImport}
        actionText="stop"
      />
    ),
    variant: 'progress',
    dismissible: false,
  });
}

export function showCompletedToast({ docsWritten }: { docsWritten: number }) {
  openToast(importToastId, {
    title: 'Import completed.',
    body: `${docsWritten} documents written.`,
    variant: 'success',
  });
}

function getToastErrorsText(errors: Error[]) {
  const rawErrorsText = errors
    .slice(0, 2)
    .map((error) => error.message)
    .join('\n');
  // Show the first two errors and a message that more errors exists.
  const errorsText = `${
    rawErrorsText.length > toastMessageCharacterLimit
      ? `${rawErrorsText.substring(0, toastMessageCharacterLimit)}…`
      : rawErrorsText
  }${
    errors.length > 2
      ? '\nMore errors occurred, open the error log to view.\n'
      : ''
  }`;
  return errorsText;
}

export function showCompletedWithErrorsToast({
  errors,
  docsWritten,
  docsProcessed,
  errorLogFilePath,
}: {
  errorLogFilePath?: string;
  errors: Error[];
  docsWritten: number;
  docsProcessed: number;
}) {
  const statusMessage = getToastErrorsText(errors);
  openToast(importToastId, {
    title: `Import completed ${docsWritten}/${docsProcessed} with the following errors:`,
    body: (
      <ImportToastBody
        statusMessage={statusMessage}
        actionHandler={
          errorLogFilePath ? () => void openFile(errorLogFilePath) : undefined
        }
        actionText="view log"
      />
    ),
    variant: 'warning',
  });
}

export function showCancelledToast({
  errorLogFilePath,
  errors,
}: {
  errorLogFilePath?: string;
  errors: Error[];
}) {
  if (errors.length > 0) {
    const statusMessage = getToastErrorsText(errors);
    openToast(importToastId, {
      title: 'Import aborted with the following errors:',
      body: (
        <ImportToastBody
          statusMessage={statusMessage}
          actionHandler={
            errorLogFilePath ? () => void openFile(errorLogFilePath) : undefined
          }
          actionText="view log"
        />
      ),
      variant: 'warning',
    });
    return;
  }

  openToast(importToastId, {
    title: 'Import aborted.',
    body: <></>,
    variant: 'warning',
  });
}

export function showFailedToast(err: Error | undefined) {
  openToast(importToastId, {
    title: 'Failed to import with the following error:',
    body: err?.message,
    variant: 'warning',
  });
}
