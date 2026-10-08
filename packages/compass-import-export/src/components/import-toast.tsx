import React from 'react';
import {
  Body,
  closeToast,
  css,
  Link,
  openToast,
  ToastBody,
  translate,
} from '@mongodb-js/compass-components';
import path from 'path';

const importToastId = 'import-toast';
const bloatedDocumentSignalToastId = 'import-toast-bloated-document';
const toastMessageCharacterLimit = 180;

export function showInProgressToast({
  language,
  fileName,
  cancelImport,
  docsWritten,
  numErrors,
  bytesProcessed,
  bytesTotal,
}: {
  language: string;
  fileName: string;
  cancelImport: () => void;
  docsWritten: number;
  numErrors: number;
  bytesProcessed: number;
  bytesTotal: number;
}) {
  // Update the toast with the new progress.
  const progress = bytesTotal ? bytesProcessed / bytesTotal : undefined;

  let statusMessage =
    docsWritten === 1
      ? translate(
          language,
          'importExport.toast.docsWritten.one',
          '{count} document written.',
          { count: docsWritten }
        )
      : translate(
          language,
          'importExport.toast.docsWritten.other',
          '{count} documents written.',
          { count: docsWritten }
        );
  if (numErrors) {
    statusMessage += ` ${
      numErrors === 1
        ? translate(
            language,
            'importExport.importToast.errors.one',
            '{count} error.',
            { count: numErrors }
          )
        : translate(
            language,
            'importExport.importToast.errors.other',
            '{count} errors.',
            { count: numErrors }
          )
    }`;
  }

  openToast(importToastId, {
    title: translate(
      language,
      'importExport.importToast.importing',
      'Importing {fileName}…',
      { fileName: path.basename(fileName) }
    ),
    description: (
      <ToastBody
        statusMessage={statusMessage}
        actionHandler={cancelImport}
        actionText={translate(language, 'importExport.toast.stop', 'stop')}
      />
    ),
    progress,
    variant: 'progress',
    dismissible: false,
  });
}

export function showStartingToast({
  language,
  fileName,
  cancelImport,
}: {
  language: string;
  fileName: string;
  cancelImport: () => void;
}) {
  openToast(importToastId, {
    title: translate(
      language,
      'importExport.importToast.importing',
      'Importing {fileName}…',
      { fileName: path.basename(fileName) }
    ),
    description: (
      <ToastBody
        statusMessage={translate(
          language,
          'importExport.toast.starting',
          'Starting…'
        )}
        actionHandler={cancelImport}
        actionText={translate(language, 'importExport.toast.stop', 'stop')}
      />
    ),
    variant: 'progress',
    dismissible: false,
  });
}

export function showCompletedToast({
  language,
  docsWritten,
}: {
  language: string;
  docsWritten: number;
}) {
  openToast(importToastId, {
    title: translate(
      language,
      'importExport.importToast.completed',
      'Import completed.'
    ),
    description:
      docsWritten === 1
        ? translate(
            language,
            'importExport.importToast.imported.one',
            '{count} document imported.',
            { count: docsWritten }
          )
        : translate(
            language,
            'importExport.importToast.imported.other',
            '{count} documents imported.',
            { count: docsWritten }
          ),
    variant: 'success',
  });
}

const reviewDocumentsCTAStyles = css({
  cursor: 'pointer',
  textDecoration: 'underline',
});

export function showBloatedDocumentSignalToast({
  language,
  onReviewDocumentsClick,
}: {
  language: string;
  onReviewDocumentsClick?: () => void;
}) {
  openToast(bloatedDocumentSignalToastId, {
    title: translate(
      language,
      'importExport.importToast.bloated.title',
      'Possibly bloated documents'
    ),
    description: (
      <>
        <Body as="span">
          {translate(
            language,
            'importExport.importToast.bloated.description',
            'The imported documents might exceed a reasonable size for performance.'
          )}
        </Body>
        {onReviewDocumentsClick && (
          <>
            <br />
            <Body
              as="strong"
              onClick={onReviewDocumentsClick}
              className={reviewDocumentsCTAStyles}
            >
              {translate(
                language,
                'importExport.importToast.reviewDocuments',
                'Review Documents'
              )}
            </Body>
          </>
        )}
      </>
    ),
    variant: 'note',
  });
}

export function showUnboundArraySignalToast({
  language,
  onReviewDocumentsClick,
}: {
  language: string;
  onReviewDocumentsClick?: () => void;
}) {
  openToast(bloatedDocumentSignalToastId, {
    title: translate(
      language,
      'importExport.importToast.largeArray.title',
      'Large array detected'
    ),
    description: (
      <>
        <Body as="span">
          {translate(
            language,
            'importExport.importToast.largeArray.description',
            'Some of the imported documents contained unbounded arrays that may degrade efficiency'
          )}
        </Body>
        {onReviewDocumentsClick && (
          <>
            <br />
            <Body
              as="strong"
              onClick={onReviewDocumentsClick}
              className={reviewDocumentsCTAStyles}
            >
              {translate(
                language,
                'importExport.importToast.reviewDocuments',
                'Review Documents'
              )}
            </Body>
          </>
        )}
      </>
    ),
    variant: 'note',
  });
}

function getToastErrorsText(language: string, errors: Error[]) {
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
      ? `\n${translate(
          language,
          'importExport.importToast.moreErrors',
          'More errors occurred, open the error log to view.'
        )}\n`
      : ''
  }`;
  return errorsText;
}

export function showCompletedWithErrorsToast({
  language,
  errors,
  docsWritten,
  docsProcessed,
  actionHandler,
}: {
  language: string;
  errors: Error[];
  docsWritten: number;
  docsProcessed: number;
  actionHandler?: () => void;
}) {
  const statusMessage = getToastErrorsText(language, errors);
  openToast(importToastId, {
    title: translate(
      language,
      'importExport.importToast.completedWithErrors',
      'Import completed {docsWritten}/{docsProcessed} with errors:',
      { docsWritten, docsProcessed }
    ),
    description: (
      <ToastBody
        statusMessage={statusMessage}
        actionHandler={actionHandler}
        actionText={translate(
          language,
          'importExport.importToast.viewLog',
          'view log'
        )}
      />
    ),
    variant: 'warning',
  });
}

export function showCancelledToast({
  language,
  errors,
  actionHandler,
}: {
  language: string;
  errors: Error[];
  actionHandler?: () => void;
}) {
  if (errors.length > 0) {
    const statusMessage = getToastErrorsText(language, errors);
    openToast(importToastId, {
      title: translate(
        language,
        'importExport.importToast.abortedWithErrors',
        'Import aborted with the following errors:'
      ),
      description: (
        <ToastBody
          statusMessage={statusMessage}
          actionHandler={actionHandler}
          actionText={translate(
            language,
            'importExport.importToast.viewLog',
            'view log'
          )}
        />
      ),
      variant: 'warning',
    });
    return;
  }

  openToast(importToastId, {
    title: translate(
      language,
      'importExport.importToast.aborted',
      'Import aborted.'
    ),
    description: null,
    variant: 'warning',
  });
}

export function showFailedToast(
  language: string,
  err: Error | undefined,
  showErrorDetails?: () => void
) {
  openToast(importToastId, {
    title: translate(
      language,
      'importExport.importToast.failed',
      'Failed to import with the following error:'
    ),
    description: (
      <>
        {err?.message}&nbsp;
        {showErrorDetails && (
          <Link
            onClick={() => {
              showErrorDetails();
              closeToast(importToastId);
            }}
            data-testid="import-error-details-button"
          >
            {translate(
              language,
              'importExport.importToast.viewErrorDetails',
              'View error details'
            )}
          </Link>
        )}
      </>
    ),
    variant: 'warning',
  });
}
