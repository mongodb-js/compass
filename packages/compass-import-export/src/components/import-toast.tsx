import React, { useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { openToast } from '@mongodb-js/compass-components';
import path from 'path';

import type { RootImportState } from '../stores/import-store';
import type { ProcessStatus } from '../constants/process-status';
import { cancelImport } from '../modules/import';
import { ImportToastBody } from './import-toast-body';
import { openFile } from '../utils/open-file';

const importToastId = 'import-toast';
const toastMessageCharacterLimit = 200;

function showInProgressToast({
  fileName,
  cancelImport,
  docsWritten,
}: {
  fileName: string;
  cancelImport: () => void;
  docsWritten: number;
}) {
  // Update the toast with the new progress.
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
    variant: 'progress',
    dismissible: false,
  });
}

function showStartingToast({
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

function showCompletedToast({ docsWritten }: { docsWritten: number }) {
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

function showCompletedWithErrorsToast({
  errors,
  docsWritten,
  docsProcessed,
  errorLogFilePath,
}: {
  errorLogFilePath: string;
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
        actionHandler={() => void openFile(errorLogFilePath)}
        actionText="view log"
      />
    ),
    variant: 'warning',
  });
}

function showCancelledToast({
  errorLogFilePath,
  errors,
}: {
  errorLogFilePath: string;
  errors: Error[];
}) {
  if (errors.length > 0) {
    const statusMessage = getToastErrorsText(errors);
    openToast(importToastId, {
      title: 'Import aborted with the following errors:',
      body: (
        <ImportToastBody
          statusMessage={statusMessage}
          actionHandler={() => void openFile(errorLogFilePath)}
          actionText="view log"
        />
      ),
      variant: 'warning',
    });
    return;
  }

  openToast(importToastId, {
    title: 'Import aborted.',
    body: null,
    variant: 'warning',
  });
}

function showFailedToast(err: Error | undefined) {
  openToast(importToastId, {
    title: 'Failed to import with the following error:',
    body: err?.message,
    variant: 'warning',
  });
}

function useImportToast({
  cancelImport,
  docsWritten,
  errorLogFilePath,
  docsProcessed,
  status,
  errors,
  fileName,
}: {
  cancelImport: () => void;
  docsWritten: number;
  errorLogFilePath: string;
  docsProcessed: number;
  status: ProcessStatus;
  errors: Error[];
  fileName: string;
}) {
  useEffect(() => {
    if (status === 'STARTED') {
      if (docsProcessed > 0) {
        showInProgressToast({
          cancelImport,
          docsWritten,
          fileName,
        });
      } else {
        showStartingToast({
          cancelImport,
          fileName,
        });
      }
    } else if (status === 'COMPLETED') {
      if (errors.length > 0) {
        showCompletedWithErrorsToast({
          docsWritten,
          errors,
          docsProcessed,
          errorLogFilePath: errorLogFilePath,
        });
      } else {
        showCompletedToast({
          docsWritten,
        });
      }
    } else if (status === 'CANCELED') {
      showCancelledToast({
        errors,
        errorLogFilePath: errorLogFilePath,
      });
    } else if (status === 'FAILED') {
      showFailedToast(errors[0]);
    }
  }, [
    status,
    docsProcessed,
    docsWritten,
    fileName,
    errorLogFilePath,
    errors,
    cancelImport,
  ]);

  const abortIfInProgress = useRef(() => {
    /* noop */
  });
  useEffect(() => {
    abortIfInProgress.current = () => {
      // When the component is dismounted, we abort the import if
      // it's in progress and update the toast.
      if (status === 'STARTED') {
        cancelImport();
        showCancelledToast({
          errors,
          errorLogFilePath: errorLogFilePath,
        });
      }
    };
  }, [errors, errorLogFilePath, cancelImport, status]);

  useEffect(() => {
    return () => {
      // Abort the import operation when it's in progress and the import is going away.
      abortIfInProgress.current?.();
    };
  }, []);

  // We return null as we're using this hook as a standalone component.
  return null;
}

const mapStateToProps = (state: RootImportState) => ({
  errors: state.importData.errors,
  fileName: state.importData.fileName,
  status: state.importData.status,
  docsWritten: state.importData.docsWritten,
  errorLogFilePath: state.importData.errorLogFilePath,
  docsProcessed: state.importData.docsProcessed,
  stopOnErrors: state.importData.stopOnErrors,
});

const ConnectedImportToast = connect(mapStateToProps, {
  cancelImport,
})(useImportToast);

export { ConnectedImportToast as ImportToast };
