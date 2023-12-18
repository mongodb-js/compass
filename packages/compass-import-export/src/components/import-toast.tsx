import React from 'react';
import {
  Body,
  css,
  openToast,
  ToastBody,
} from '@mongodb-js/compass-components';
import path from 'path';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

import { openFile } from '../utils/open-file';

const { track } = createLoggerAndTelemetry('COMPASS-IMPORT-EXPORT-UI');

const importToastId = 'import-toast';
const bloatedDocumentSignalToastId = 'import-toast-bloated-document';
const toastMessageCharacterLimit = 180;

function trackLogFileOpened(errors: Error[]) {
  track('Import Error Log Opened', {
    errorCount: errors.length,
  });
}

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
    description: (
      <ToastBody
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
    description: (
      <ToastBody
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
    description: `${docsWritten} document${
      docsWritten === 1 ? '' : 's'
    } imported.`,
    variant: 'success',
  });
}

const reviewDocumentsCTAStyles = css({
  cursor: 'pointer',
  textDecoration: 'underline',
});

export function showBloatedDocumentSignalToast({
  onReviewDocumentsClick,
}: {
  onReviewDocumentsClick?: () => void;
}) {
  openToast(bloatedDocumentSignalToastId, {
    title: 'Possibly bloated documents',
    description: (
      <>
        <Body as="span">
          The imported documents might exceed a reasonable size for performance.
        </Body>
        {onReviewDocumentsClick && (
          <>
            <br />
            <Body
              as="strong"
              onClick={onReviewDocumentsClick}
              className={reviewDocumentsCTAStyles}
            >
              Review Documents
            </Body>
          </>
        )}
      </>
    ),
    variant: 'note',
  });
}

export function showUnboundArraySignalToast({
  onReviewDocumentsClick,
}: {
  onReviewDocumentsClick?: () => void;
}) {
  openToast(bloatedDocumentSignalToastId, {
    title: 'Large array detected',
    description: (
      <>
        <Body as="span">
          Some of the imported documents contained unbounded arrays that may
          degrade efficiency
        </Body>
        {onReviewDocumentsClick && (
          <>
            <br />
            <Body
              as="strong"
              onClick={onReviewDocumentsClick}
              className={reviewDocumentsCTAStyles}
            >
              Review Documents
            </Body>
          </>
        )}
      </>
    ),
    variant: 'note',
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
    title: `Import completed ${docsWritten}/${docsProcessed} with errors:`,
    description: (
      <ToastBody
        statusMessage={statusMessage}
        actionHandler={
          errorLogFilePath
            ? () => {
                trackLogFileOpened(errors);
                void openFile(errorLogFilePath);
              }
            : undefined
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
      description: (
        <ToastBody
          statusMessage={statusMessage}
          actionHandler={
            errorLogFilePath
              ? () => {
                  trackLogFileOpened(errors);
                  void openFile(errorLogFilePath);
                }
              : undefined
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
    description: null,
    variant: 'warning',
  });
}

export function showFailedToast(err: Error | undefined) {
  openToast(importToastId, {
    title: 'Failed to import with the following error:',
    description: err?.message,
    variant: 'warning',
  });
}
