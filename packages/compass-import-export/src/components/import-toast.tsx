import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { openToast } from '@mongodb-js/compass-components';

import type { RootImportState } from '../stores/import-store';
import type { ProcessStatus } from '../constants/process-status';
import { cancelImport } from '../modules/import';
import { ImportToastBody } from './import-toast-body';
import { openFile } from '../utils/open-file';
import type { AcceptedFileType } from '../constants/file-types';

const importToastId = 'import-toast';
const toastMessageCharacterLimit = 200;

function showInProgressToast({
  fileType,
  cancelImport,
  docsWritten,
  docsProcessed,
}: {
  fileType: string;
  cancelImport: () => void;
  docsWritten: number;
  docsProcessed: number;
}) {
  // Update the toast with the new progress.
  openToast(importToastId, {
    title: `Importing ${fileType} file…`,
    body: (
      <ImportToastBody
        statusMessage={`${docsWritten}/${docsProcessed} document${
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
  fileType,
  cancelImport,
}: {
  fileType: string;
  cancelImport: () => void;
}) {
  openToast(importToastId, {
    title: `Importing ${fileType} file…`,
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
  fileType,
}: {
  cancelImport: () => void;
  docsWritten: number;
  errorLogFilePath: string;
  docsProcessed: number;
  status: ProcessStatus;
  errors: Error[];
  fileType: AcceptedFileType | '';
}) {
  useEffect(() => {
    if (status === 'STARTED') {
      if (docsProcessed > 0) {
        showInProgressToast({
          cancelImport,
          docsWritten,
          docsProcessed,
          fileType,
        });
      } else {
        showStartingToast({
          cancelImport,
          fileType,
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
    fileType,
    errorLogFilePath,
    errors,
    cancelImport,
  ]);

  // We return null as we're using this hook as a standalone component.
  return null;
}

const mapStateToProps = (state: RootImportState) => ({
  errors: state.importData.errors,
  fileType: state.importData.fileType,
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
