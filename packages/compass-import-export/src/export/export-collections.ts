import fs from 'fs';
import path from 'path';
import { EJSON } from 'bson';
import type { Document } from 'bson';
import type { DataService } from 'mongodb-data-service';

import { exportJSONFromQuery } from './export-json';
import type { ExportJSONFormat } from './export-json';
import { exportCSVFromQuery } from './export-csv';
import type { CSVExportPhase } from './export-csv';
import { createDebug } from '../utils/logger';

const debug = createDebug('export-collections');

export type CollectionExportResult = {
  collectionName: string;
  filePath: string;
  docsWritten: number;
  aborted: boolean;
  error?: Error;
};

export type ExportCollectionsResult = {
  collections: CollectionExportResult[];
  aborted: boolean;
};

type ExportCollectionsOptions = {
  databaseName: string;
  collectionNames: string[];
  directoryPath: string;
  dataService: Pick<DataService, 'findCursor' | 'collectionInfo' | 'indexes'>;
  fileType: 'json' | 'csv';
  // Only used for JSON.
  variant: ExportJSONFormat;
  // Only used for CSV.
  escapeFormulae?: boolean;
  includeMetadata: boolean;
  abortSignal?: AbortSignal;
  onCollectionStart?: (collectionName: string, index: number) => void;
  progressCallback?: (
    collectionName: string,
    docsWritten: number,
    csvPhase?: CSVExportPhase
  ) => void;
};

// Characters that are allowed in collection names but not in file names on
// at least one platform. They are percent-encoded so that the original name
// can be recovered from the file name.
// eslint-disable-next-line no-control-regex -- control characters are not valid in file names
const UNSAFE_FILE_NAME_CHARACTERS = /[<>:"/\\|?*%\x00-\x1f]/g;

export function collectionNameToFileName(collectionName: string): string {
  return collectionName.replace(
    UNSAFE_FILE_NAME_CHARACTERS,
    (char) =>
      `%${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`
  );
}

/**
 * Builds the contents of `<collection>.metadata.json`: the collection options
 * and the index specifications needed to recreate the collection. The shape
 * follows the metadata files written by mongodump where the information is
 * available.
 */
export async function getCollectionMetadata({
  databaseName,
  collectionName,
  dataService,
}: {
  databaseName: string;
  collectionName: string;
  dataService: Pick<DataService, 'collectionInfo' | 'indexes'>;
}): Promise<Document> {
  const ns = `${databaseName}.${collectionName}`;
  const [info, indexes] = await Promise.all([
    dataService.collectionInfo(databaseName, collectionName),
    dataService.indexes(ns),
  ]);

  const options: Document = {};
  if (info?.validation) {
    options.validator = info.validation.validator;
    options.validationLevel = info.validation.validationLevel;
    options.validationAction = info.validation.validationAction;
  }
  if (info?.collation) {
    options.collation = info.collation;
  }

  return {
    collectionName,
    type: 'collection',
    options,
    indexes: indexes.map(({ name, key, version, extra }) => ({
      v: version,
      key,
      name,
      ...extra,
    })),
  };
}

async function exportCollection({
  databaseName,
  collectionName,
  directoryPath,
  dataService,
  fileType,
  variant,
  escapeFormulae = true,
  includeMetadata,
  abortSignal,
  progressCallback,
}: Omit<ExportCollectionsOptions, 'collectionNames' | 'onCollectionStart'> & {
  collectionName: string;
}): Promise<CollectionExportResult> {
  const fileName = collectionNameToFileName(collectionName);
  const filePath = path.join(directoryPath, `${fileName}.${fileType}`);

  if (includeMetadata) {
    const metadata = await getCollectionMetadata({
      databaseName,
      collectionName,
      dataService,
    });
    await fs.promises.writeFile(
      path.join(directoryPath, `${fileName}.metadata.json`),
      EJSON.stringify(metadata, undefined, 2, { relaxed: false })
    );
  }

  const output = fs.createWriteStream(filePath);
  try {
    const baseExportOptions = {
      ns: `${databaseName}.${collectionName}`,
      dataService,
      output,
      abortSignal,
    };
    // CSV always includes every field: the columns are gathered from the
    // documents themselves, like a single-collection export of all fields.
    const { docsWritten, aborted } =
      fileType === 'csv'
        ? await exportCSVFromQuery({
            ...baseExportOptions,
            escapeFormulae,
            progressCallback: (index, csvPhase) =>
              progressCallback?.(collectionName, index, csvPhase),
          })
        : await exportJSONFromQuery({
            ...baseExportOptions,
            variant,
            progressCallback: (index) =>
              progressCallback?.(collectionName, index),
          });
    return { collectionName, filePath, docsWritten, aborted };
  } finally {
    output.close();
  }
}

/**
 * Exports each collection to `<directoryPath>/<collection>.<fileType>`, one
 * after the other. A failure in one collection is recorded in its result and the
 * export moves on to the next one; aborting stops the whole export.
 */
export async function exportCollectionsToDirectory({
  collectionNames,
  onCollectionStart,
  ...options
}: ExportCollectionsOptions): Promise<ExportCollectionsResult> {
  debug('exportCollectionsToDirectory()', {
    databaseName: options.databaseName,
    collectionNames,
    directoryPath: options.directoryPath,
  });

  await fs.promises.mkdir(options.directoryPath, { recursive: true });

  const collections: CollectionExportResult[] = [];
  for (const [index, collectionName] of collectionNames.entries()) {
    if (options.abortSignal?.aborted) {
      break;
    }
    onCollectionStart?.(collectionName, index);
    try {
      collections.push(await exportCollection({ ...options, collectionName }));
    } catch (err) {
      debug('failed to export collection', { collectionName, err });
      collections.push({
        collectionName,
        filePath: path.join(
          options.directoryPath,
          `${collectionNameToFileName(collectionName)}.${options.fileType}`
        ),
        docsWritten: 0,
        aborted: false,
        error: err as Error,
      });
    }
  }

  return {
    collections,
    aborted: !!options.abortSignal?.aborted,
  };
}
