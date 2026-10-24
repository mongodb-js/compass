import React from 'react';
import { openToast, ToastBody } from '@mongodb-js/compass-components';

import revealFile from '../utils/reveal-file';
import type { CollectionExportResult } from '../export/export-collections';
import type { CSVExportPhase } from '../export/export-csv';

const exportCollectionsToastId = 'export-collections-toast';

const docsWrittenText = (docsWritten: number) => {
  return `${docsWritten} document${docsWritten !== 1 ? 's' : ''} written`;
};

export function showExportCollectionsInProgressToast({
  databaseName,
  collectionName,
  collectionIndex,
  collectionCount,
  docsWritten,
  csvPhase,
  cancelExport,
}: {
  databaseName: string;
  collectionName: string;
  collectionIndex: number;
  collectionCount: number;
  docsWritten: number;
  csvPhase?: CSVExportPhase;
  cancelExport: () => void;
}) {
  // A CSV export first reads every document to find the columns.
  const progressText =
    csvPhase === 'DOWNLOAD'
      ? `processing documents, ${docsWritten} processed`
      : docsWrittenText(docsWritten);

  openToast(exportCollectionsToastId, {
    title: `Exporting ${collectionCount} collections from "${databaseName}"…`,
    description: (
      <ToastBody
        statusMessage={`${
          collectionIndex + 1
        } of ${collectionCount}: "${collectionName}", ${progressText}.`}
        actionHandler={cancelExport}
        actionText="stop"
      />
    ),
    progress: collectionIndex / collectionCount,
    variant: 'progress',
    dismissible: false,
  });
}

export function showExportCollectionsFinishedToast({
  collections,
  directoryPath,
  aborted,
}: {
  collections: CollectionExportResult[];
  directoryPath: string;
  aborted: boolean;
}) {
  const failed = collections.filter((collection) => collection.error);
  const docsWritten = collections.reduce(
    (total, collection) => total + collection.docsWritten,
    0
  );
  const exported = collections.length - failed.length;

  const statusMessage = [
    `${exported} collection${
      exported !== 1 ? 's' : ''
    } exported, ${docsWrittenText(docsWritten)}.`,
    ...failed.map(
      ({ collectionName, error }) =>
        `Failed to export "${collectionName}": ${error?.message ?? ''}`
    ),
  ].join(' ');

  openToast(exportCollectionsToastId, {
    title: aborted
      ? 'Export aborted.'
      : failed.length > 0
        ? 'Export completed with errors.'
        : 'Export completed.',
    description: (
      <ToastBody
        statusMessage={statusMessage}
        actionHandler={() => revealFile(directoryPath)}
        actionText="show folder"
      />
    ),
    variant: aborted || failed.length > 0 ? 'warning' : 'success',
  });
}

export function showExportCollectionsFailedToast(err: Error | undefined) {
  openToast(exportCollectionsToastId, {
    title: 'Failed to export with the following error:',
    description: err?.message,
    variant: 'warning',
  });
}
