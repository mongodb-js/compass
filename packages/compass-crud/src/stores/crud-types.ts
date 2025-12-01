import type { TypeCastMap } from 'hadron-type-checker';
import type { Document } from 'hadron-document';
import type { DOCUMENTS_STATUSES } from '../constants/documents-statuses';
import type { UpdatePreview } from 'mongodb-data-service';
import type { TableHeaderType } from './grid-types';
import type { Collection } from '@mongodb-js/compass-app-stores/provider';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';

export type BSONObject = TypeCastMap['Object'];
export type BSONArray = TypeCastMap['Array'];

export type EmittedAppRegistryEvents =
  | 'open-import'
  | 'open-export'
  | 'document-deleted'
  | 'document-inserted';

export type DocumentView = 'List' | 'JSON' | 'Table';

export type InsertCSFLEState = {
  state:
    | 'none'
    | 'no-known-schema'
    | 'incomplete-schema-for-cloned-doc'
    | 'has-known-schema'
    | 'csfle-disabled';
  encryptedFields?: string[];
};

export type WriteError = {
  message: string;
  info?: Record<string, unknown>;
};

export type InsertState = {
  doc: null | Document;
  jsonDoc: null | string;
  error?: WriteError;
  csfleState: InsertCSFLEState;
  mode: 'modifying' | 'error';
  jsonView: boolean;
  isOpen: boolean;
  isCommentNeeded: boolean;
};

export type BulkUpdateState = {
  isOpen: boolean;
  updateText: string;
  preview: UpdatePreview;
  syntaxError?: Error;
  serverError?: Error;
  affected?: number;
};

export type TableState = {
  doc: Document | null;
  path: (string | number)[];
  types: TableHeaderType[];
  editParams: null | {
    colId: string | number;
    rowIndex: number;
  };
};

export type BulkDeleteState = {
  previews: Document[];
  status: 'open' | 'closed' | 'in-progress';
  affected?: number;
};

type CollectionStats = Pick<
  Collection,
  'document_count' | 'storage_size' | 'free_storage_size' | 'avg_document_size'
>;

export type CrudState = {
  ns: string;
  collection: string;
  error: Error | null;
  docs: Document[] | null;
  start: number;
  end: number;
  page: number;
  version: string;
  view: DocumentView;
  count: number | null;
  isDataLake: boolean;
  isReadonly: boolean;
  isTimeSeries: boolean;
  status: DOCUMENTS_STATUSES;
  lastCountRunMaxTimeMS: number;
  debouncingLoad: boolean;
  loadingCount: boolean;
  shardKeys: null | BSONObject;
  resultId: number;
  isWritable: boolean;
  instanceDescription: string;
  isCollectionScan?: boolean;
  isSearchIndexesSupported: boolean;
  isUpdatePreviewSupported: boolean;
  docsPerPage: number;
  collectionStats: CollectionStats | null;
};

export type CrudStoreOptions = Pick<
  CollectionTabPluginMetadata,
  | 'query'
  | 'isReadonly'
  | 'namespace'
  | 'isTimeSeries'
  | 'isSearchIndexesSupported'
  | 'sourceName'
> & {
  noRefreshOnConfigure?: boolean;
};

export const INITIAL_BULK_UPDATE_TEXT = `{
  $set: {

  },
}`;

export const DEFAULT_NUM_PAGE_DOCS = 25;
export const COUNT_MAX_TIME_MS_CAP = 5000;
export const MAX_DOCS_PER_PAGE_STORAGE_KEY = 'compass_crud-max_docs_per_page';
export const DEFAULT_INITIAL_MAX_TIME_MS = 60000;

export const DELETE_ERROR = new Error(
  'Cannot delete documents that do not have an _id field.'
);

export const EMPTY_UPDATE_ERROR = new Error(
  'Unable to update, no changes have been made.'
);

// Re-export action types for compatibility
import type { Element } from 'hadron-document';
export type CrudActions = {
  drillDown(
    doc: Document,
    element: Element,
    editParams?: {
      colId: string;
      rowIndex: number;
    }
  ): void;
  updateDocument(doc: Document): Promise<void>;
  removeDocument(doc: Document): Promise<void>;
  replaceDocument(doc: Document): Promise<void>;
  openInsertDocumentDialog(doc: BSONObject, cloned: boolean): Promise<void>;
  copyToClipboard(doc: Document): void;
  openBulkDeleteDialog(): void;
  runBulkUpdate(): Promise<void>;
  closeBulkDeleteDialog(): void;
  runBulkDelete(): Promise<void>;
  openDeleteQueryExportToLanguageDialog(): void;
  saveUpdateQuery(name: string): Promise<void>;
};
