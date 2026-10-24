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
const UNSAFE_FILE_NAME_CHARACTER = /[<>:"/\\|?*%\x00-\x1f]/;

// Device names that Windows reserves regardless of the extension.
const WINDOWS_RESERVED_NAME = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\.|$)/i;

const METADATA_FILE_SUFFIX = '.metadata.json';

function percentEncode(char: string): string {
  return `%${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`;
}

/**
 * Turns a collection name into a file name (without extension) that is valid
 * on every platform. `encodeAlso` percent-encodes more characters, which is
 * used to tell apart names that only differ by case on case-insensitive file
 * systems. The result is decoded back with `fileNameToCollectionName()`.
 */
export function collectionNameToFileName(
  collectionName: string,
  encodeAlso?: RegExp
): string {
  let fileName = [...collectionName]
    .map((char) =>
      UNSAFE_FILE_NAME_CHARACTER.test(char) || encodeAlso?.test(char)
        ? percentEncode(char)
        : char
    )
    .join('');
  // Windows doesn't allow file names ending with a dot or a space.
  fileName = fileName.replace(/[. ]$/, percentEncode);
  if (WINDOWS_RESERVED_NAME.test(fileName)) {
    fileName = percentEncode(fileName[0]) + fileName.slice(1);
  }
  // A data file must not look like the metadata file of another collection.
  return fileName.replace(/\.(metadata)$/i, '%2E$1');
}

/**
 * Picks a file name for every collection so that no two files clash, also on
 * case-insensitive file systems (Windows, macOS): `Orders` and `orders` would
 * otherwise overwrite each other. Collections without a free name map to
 * `undefined`.
 */
export function assignFileNames(
  collectionNames: string[],
  fileType: 'json' | 'csv'
): Map<string, string | undefined> {
  const usedPaths = new Set<string>();
  const fileNames = new Map<string, string | undefined>();
  for (const collectionName of collectionNames) {
    const candidates = [
      collectionNameToFileName(collectionName),
      collectionNameToFileName(collectionName, /[A-Z]/),
      collectionNameToFileName(collectionName, /[A-Za-z]/),
    ];
    const fileName = candidates.find((candidate) => {
      const paths = [
        `${candidate}.${fileType}`,
        candidate + METADATA_FILE_SUFFIX,
      ];
      return paths.every((filePath) => !usedPaths.has(filePath.toLowerCase()));
    });
    if (fileName) {
      usedPaths.add(`${fileName}.${fileType}`.toLowerCase());
      usedPaths.add((fileName + METADATA_FILE_SUFFIX).toLowerCase());
    }
    fileNames.set(collectionName, fileName);
  }
  return fileNames;
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
  fileName,
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
  fileName: string;
}): Promise<CollectionExportResult> {
  const filePath = path.join(directoryPath, `${fileName}.${fileType}`);

  if (includeMetadata) {
    const metadata = await getCollectionMetadata({
      databaseName,
      collectionName,
      dataService,
    });
    await fs.promises.writeFile(
      path.join(directoryPath, fileName + METADATA_FILE_SUFFIX),
      EJSON.stringify(metadata, undefined, 2, { relaxed: false })
    );
  }

  // Opening the file first makes a failure to create it (e.g. a read-only
  // folder) reject here, instead of an 'error' event on a stream that nothing
  // listens to yet.
  const fileHandle = await fs.promises.open(filePath, 'w');
  const output = fileHandle.createWriteStream();
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

  const fileNames = assignFileNames(collectionNames, options.fileType);
  const collections: CollectionExportResult[] = [];
  for (const [index, collectionName] of collectionNames.entries()) {
    if (options.abortSignal?.aborted) {
      break;
    }
    onCollectionStart?.(collectionName, index);
    const fileName = fileNames.get(collectionName);
    try {
      if (!fileName) {
        throw new Error(
          'Its file name would overwrite the file of another collection.'
        );
      }
      collections.push(
        await exportCollection({ ...options, collectionName, fileName })
      );
    } catch (err) {
      debug('failed to export collection', { collectionName, err });
      collections.push({
        collectionName,
        filePath: path.join(
          options.directoryPath,
          `${fileName ?? collectionNameToFileName(collectionName)}.${
            options.fileType
          }`
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
