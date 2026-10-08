import React from 'react';
import {
  openToast,
  ToastBody,
  translate,
} from '@mongodb-js/compass-components';
import path from 'path';

import revealFile from '../utils/reveal-file';
import type { CSVExportPhase } from '../export/export-csv';

const exportToastId = 'export-toast';

const docsWrittenText = (language: string, docsWritten: number) => {
  return docsWritten === 1
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
};

export function showInProgressToast({
  language,
  filePath,
  namespace,
  cancelExport,
  docsWritten,
  csvPhase,
}: {
  language: string;
  filePath: string;
  namespace: string;
  cancelExport: () => void;
  docsWritten: number;
  csvPhase?: CSVExportPhase;
}) {
  let statusMessage = docsWrittenText(language, docsWritten);

  if (csvPhase === 'DOWNLOAD') {
    statusMessage =
      docsWritten === 1
        ? translate(
            language,
            'importExport.exportToast.processing.one',
            'Processing documents before exporting, {count} document processed.',
            { count: docsWritten }
          )
        : translate(
            language,
            'importExport.exportToast.processing.other',
            'Processing documents before exporting, {count} documents processed.',
            { count: docsWritten }
          );
  }

  // Update the toast with the new progress.
  openToast(exportToastId, {
    title: translate(
      language,
      'importExport.exportToast.exportingTo',
      'Exporting "{namespace}" to {fileName}…',
      { namespace, fileName: path.basename(filePath) }
    ),
    description: (
      <ToastBody
        statusMessage={statusMessage}
        actionHandler={cancelExport}
        actionText={translate(language, 'importExport.toast.stop', 'stop')}
      />
    ),
    progress: undefined, // Don't show progress as there is no total document count.
    variant: 'progress',
    dismissible: false,
  });
}

export function showStartingToast({
  language,
  namespace,
  cancelExport,
}: {
  language: string;
  namespace: string;
  cancelExport: () => void;
}) {
  openToast(exportToastId, {
    title: translate(
      language,
      'importExport.exportToast.exporting',
      'Exporting "{namespace}"…',
      { namespace }
    ),
    description: (
      <ToastBody
        statusMessage={translate(
          language,
          'importExport.toast.starting',
          'Starting…'
        )}
        actionHandler={cancelExport}
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
  filePath,
}: {
  language: string;
  docsWritten: number;
  filePath: string;
}) {
  openToast(exportToastId, {
    title: translate(
      language,
      'importExport.exportToast.completed',
      'Export completed.'
    ),
    description: (
      <ToastBody
        statusMessage={docsWrittenText(language, docsWritten)}
        actionHandler={() => revealFile(filePath)}
        actionText={translate(
          language,
          'importExport.exportToast.showFile',
          'show file'
        )}
      />
    ),
    variant: 'success',
  });
}

export function showCancelledToast({
  language,
  docsWritten,
  filePath,
}: {
  language: string;
  filePath: string;
  docsWritten: number;
}) {
  openToast(exportToastId, {
    title: translate(
      language,
      'importExport.exportToast.aborted',
      'Export aborted.'
    ),
    description:
      docsWritten > 0 ? (
        <ToastBody
          statusMessage={docsWrittenText(language, docsWritten)}
          actionHandler={() => revealFile(filePath)}
          actionText={translate(
            language,
            'importExport.exportToast.showFile',
            'show file'
          )}
        />
      ) : null,
    variant: 'warning',
  });
}

export function showFailedToast(language: string, err: Error | undefined) {
  openToast(exportToastId, {
    title: translate(
      language,
      'importExport.exportToast.failed',
      'Failed to export with the following error:'
    ),
    description: err?.message,
    variant: 'warning',
  });
}
