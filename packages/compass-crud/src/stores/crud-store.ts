import type { Listenable, Store } from 'reflux';
import Reflux from 'reflux';
import toNS from 'mongodb-ns';
import { findIndex, isEmpty, isEqual } from 'lodash';
// @ts-expect-error no types available
import StateMixin from 'reflux-state-mixin';
import type { Element } from 'hadron-document';
import { Document } from 'hadron-document';
import HadronDocument from 'hadron-document';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model';

import {
  findDocuments,
  countDocuments,
  fetchShardingKeys,
  objectContainsRegularExpression,
} from '../utils';

import type { DOCUMENTS_STATUSES } from '../constants/documents-statuses';
import {
  DOCUMENTS_STATUS_INITIAL,
  DOCUMENTS_STATUS_FETCHING,
  DOCUMENTS_STATUS_ERROR,
  DOCUMENTS_STATUS_FETCHED_INITIAL,
  DOCUMENTS_STATUS_FETCHED_CUSTOM,
  DOCUMENTS_STATUS_FETCHED_PAGINATION,
} from '../constants/documents-statuses';

import type { DataService } from 'mongodb-data-service';
import type {
  GridStore,
  GridStoreOptions,
  TableHeaderType,
} from './grid-store';
import configureGridStore from './grid-store';
import type { TypeCastMap } from 'hadron-type-checker';
import type AppRegistry from 'hadron-app-registry';
import { BaseRefluxStore } from './base-reflux-store';
export type BSONObject = TypeCastMap['Object'];
export type BSONArray = TypeCastMap['Array'];
type Mutable<T> = { -readonly [P in keyof T]: T[P] };

export type CrudActions = {
  drillDown(
    doc: Document,
    element: Element,
    editParams?: {
      colId: string;
      rowIndex: number;
    }
  ): void;
  updateDocument(doc: Document): void;
  removeDocument(doc: Document): void;
  replaceDocument(doc: Document): void;
  openInsertDocumentDialog(doc: BSONObject, cloned: boolean): void;
  copyToClipboard(doc: Document): void; //XXX
};

const { debug, log, mongoLogId, track } =
  createLoggerAndTelemetry('COMPASS-CRUD-UI');

function pickQueryProps({
  filter,
  sort,
  limit,
  skip,
  maxTimeMS,
  project,
  collation,
}: Partial<QueryState> = {}): Partial<QueryState> {
  const query: Partial<QueryState> = {
    filter,
    sort,
    limit,
    skip,
    maxTimeMS,
    project,
    collation,
  };
  for (const key of Object.keys(query) as (keyof QueryState)[]) {
    if (query[key] === null || query[key] === undefined) {
      delete query[key];
    }
  }
  return query;
}

/**
 * Number of docs per page.
 */
const NUM_PAGE_DOCS = 20;

/**
 * Error constant.
 */
const ERROR = 'error';

/**
 * Modifying constant.
 */
const MODIFYING = 'modifying';

/**
 * The list view constant.
 */
const LIST = 'List';

/**
 * The delete error message.
 */
const DELETE_ERROR = new Error(
  'Cannot delete documents that do not have an _id field.'
);

/**
 * The empty update error message.
 */
const EMPTY_UPDATE_ERROR = new Error(
  'Unable to update, no changes have been made.'
);

/**
 * Default max time ms for the first query which is not getting the value from
 * the query bar.
 */
const DEFAULT_INITIAL_MAX_TIME_MS = 60000;

/**
 * A cap for the maxTimeMS used for countDocuments. This value is used
 * in place of the query maxTimeMS unless that is smaller.
 *
 * Due to the limit of 20 documents the batch of data for the query is usually
 * ready sooner than the count.
 *
 * We want to make sure `count` does not hold back the query results for too
 * long after docs are returned.
 */
const COUNT_MAX_TIME_MS_CAP = 5000;

/**
 * Set the data provider.
 *
 * @param {Store} store - The store.
 * @param {Error} error - The error (if any) while connecting.
 * @param {Object} provider - The data provider.
 */
export const setDataProvider = (
  store: CrudStoreImpl,
  error: Error | null | undefined,
  provider: DataService
) => {
  store.setDataService(error, provider);
};

/**
 * Set the isReadonly flag in the store.
 *
 * @param {Store} store - The store.
 * @param {Boolean} isReadonly - If the collection is readonly.
 */
export const setIsReadonly = (store: CrudStoreImpl, isReadonly: boolean) => {
  store.onReadonlyChanged(isReadonly);
};

/**
 * Set the isEditable flag in the store.
 *
 * @param {Store} store - The store.
 */
export const setIsEditable = (store: CrudStoreImpl, hasProjection: boolean) => {
  const isEditable = isListEditable({
    isDataLake: store.state.isDataLake,
    isReadonly: store.state.isReadonly,
    hasProjection,
  });
  store.onIsEditableChanged(isEditable);
};

/**
 * Set the isTimeSeries flag in the store.
 *
 * @param {Store} store - The store.
 * @param {Boolean} isTimeSeries - If the collection is a time-series collection.
 */
export const setIsTimeSeries = (
  store: CrudStoreImpl,
  isTimeSeries: boolean
) => {
  store.onTimeSeriesChanged(isTimeSeries);
};

/**
 * Set the namespace in the store.
 *
 * @param {Store} store - The store.
 * @param {String} ns - The namespace in "db.collection" format.
 */
export const setNamespace = (store: CrudStoreImpl, ns: string) => {
  store.onCollectionChanged(ns);
};

/**
 * Set the global app registry.
 *
 * @param {Store} store - The store.
 * @param {AppRegistry} appRegistry - The app registry.
 */
export const setGlobalAppRegistry = (
  store: CrudStoreImpl,
  appRegistry: AppRegistry
) => {
  store.globalAppRegistry = appRegistry;
};

/**
 * Set the local app registry.
 *
 * @param {Store} store - The store.
 * @param {AppRegistry} appRegistry - The app registry.
 */
export const setLocalAppRegistry = (
  store: CrudStoreImpl,
  appRegistry: AppRegistry
) => {
  store.localAppRegistry = appRegistry;
};

/**
 * Determine if the document list is editable.
 *
 * @param {Object} opts - The options to determine if the list is editable.
 *
 * @returns {Boolean} If the list is editable.
 */
export const isListEditable = ({
  isDataLake,
  isReadonly,
  hasProjection,
}: {
  isDataLake: boolean;
  isReadonly: boolean;
  hasProjection: boolean;
}) => {
  return !hasProjection && !isDataLake && !isReadonly;
};

type CrudStoreOptions = {
  actions: {
    [key in keyof CrudActions]: Listenable;
  };
  query?: Partial<QueryState>;
  localAppRegistry: AppRegistry;
  globalAppRegistry: AppRegistry;
  isReadonly: boolean;
  namespace: string;
  isTimeSeries: boolean;
  dataProvider: { error?: Error; dataProvider?: DataService };
  noRefreshOnConfigure?: boolean;
};

export type InsertCSFLEState = {
  state:
    | 'none'
    | 'no-known-schema'
    | 'incomplete-schema-for-cloned-doc'
    | 'has-known-schema'
    | 'csfle-disabled';
  encryptedFields?: string[];
};

type InsertState = {
  doc: null | Document;
  jsonDoc: null | string;
  message: string;
  csfleState: InsertCSFLEState;
  mode: 'modifying' | 'error';
  jsonView: boolean;
  isOpen: boolean;
  isCommentNeeded: boolean;
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

type QueryState = {
  filter: BSONObject;
  sort: null | BSONObject;
  limit: number;
  skip: number;
  maxTimeMS: number;
  project: null | BSONObject;
  collation: null | BSONObject;
};

type CrudState = {
  ns: string;
  collection: string;
  abortController: AbortController | null;
  error: Error | null;
  docs: Document[] | null;
  start: number;
  end: number;
  page: number;
  version: string;
  isEditable: boolean;
  view: 'List' | 'JSON' | 'Table';
  count: number | null;
  insert: InsertState;
  table: TableState;
  query: QueryState;
  isDataLake: boolean;
  isReadonly: boolean;
  isTimeSeries: boolean;
  status: DOCUMENTS_STATUSES;
  debouncingLoad: boolean;
  loadingCount: boolean;
  outdated: boolean;
  shardKeys: null | BSONObject;
  resultId: number;
  isWritable: boolean;
  instanceDescription: string;
  fields: string[];
};

class CrudStoreImpl
  extends BaseRefluxStore<CrudStoreOptions>
  implements CrudActions
{
  mixins = [StateMixin.store];
  listenables: unknown[];

  // Should this be readonly? The existence of setState would imply that...
  // readonly state!: Readonly<CrudState>
  state!: CrudState;
  setState!: (newState: Partial<CrudState>) => void;
  dataService!: DataService;
  localAppRegistry!: AppRegistry;
  globalAppRegistry!: AppRegistry;

  constructor(options: CrudStoreOptions) {
    super(options);
    this.listenables = options.actions as any; // TODO: The types genuinely mismatch here
  }

  updateFields(fields: { autocompleteFields: { name: string }[] }) {
    this.setState({
      fields: fields.autocompleteFields.map((field) => field.name),
    });
  }

  getInitialState(): CrudState {
    return {
      ns: '',
      collection: '',
      abortController: null,
      error: null,
      docs: [],
      start: 0,
      version: '3.4.0',
      end: 0,
      page: 0,
      isEditable: true,
      view: LIST,
      count: 0,
      insert: this.getInitialInsertState(),
      table: this.getInitialTableState(),
      query: this.getInitialQueryState(),
      isDataLake: false,
      isReadonly: false,
      isTimeSeries: false,
      status: DOCUMENTS_STATUS_INITIAL,
      debouncingLoad: false,
      loadingCount: false,
      outdated: false,
      shardKeys: null,
      resultId: resultId(),
      isWritable: false,
      instanceDescription: '',
      fields: [],
    };
  }

  /**
   * Get the initial insert state.
   *
   * @returns {Object} The initial insert state.
   */
  getInitialInsertState(): InsertState {
    return {
      doc: null,
      jsonDoc: null,
      message: '',
      csfleState: { state: 'none' },
      mode: MODIFYING,
      jsonView: false,
      isOpen: false,
      isCommentNeeded: true,
    };
  }

  /**
   * Get the initial table state.
   *
   * @returns {Object} The initial table state.
   */
  getInitialTableState(): TableState {
    return {
      doc: null,
      path: [],
      types: [],
      editParams: null,
    };
  }

  /**
   * Get the initial query state.
   *
   * @returns {Object} The initial query state.
   */
  getInitialQueryState(): QueryState {
    return {
      filter: {},
      sort: null,
      limit: 0,
      skip: 0,
      maxTimeMS: DEFAULT_INITIAL_MAX_TIME_MS,
      project: null,
      collation: null,
      ...pickQueryProps(this.options.query ?? {}),
    };
  }

  /**
   * Returns the current view in the format used for telemetry
   * ('list', 'json', 'table'). Grouped here so that this is easy
   * to update if the labels change at some point.
   */
  modeForTelemetry() {
    return this.state.view.toLowerCase();
  }

  /**
   * Set if the collection is readonly.
   *
   * @param {Boolean} isReadonly - If the collection is readonly.
   */
  onReadonlyChanged(isReadonly: boolean) {
    this.setState({ isReadonly });
  }

  /**
   * Set if the collection is readonly.
   *
   * @param {Boolean} isEditable - If Compass is readonly
   */
  onIsEditableChanged(isEditable: boolean) {
    this.setState({ isEditable });
  }

  /**
   * Set if the collection is a time-series collection.
   *
   * @param {Boolean} isTimeSeries - If the collection is time-series.
   */
  onTimeSeriesChanged(isTimeSeries: boolean) {
    this.setState({ isTimeSeries });
  }

  /**
   * Plugin lifecycle method that is called when the namespace changes in
   * Compass. Trigger with new namespace and cleared path/types.
   *
   * @param {String} ns - The new namespace.
   */
  onCollectionChanged(ns: string) {
    const nsobj = toNS(ns);
    this.setState({
      ns: ns,
      collection: nsobj.collection,
      table: this.getInitialTableState(),
      query: this.getInitialQueryState(),
    });
  }

  /**
   * Fires when the query is changed.
   *
   * @param {Object} state - The query state.
   */
  onQueryChanged(
    state: Pick<Partial<QueryState>, 'filter' | 'skip'> &
      Omit<QueryState, 'filter' | 'skip'>
  ) {
    this.state.query.filter = state.filter || {};
    this.state.query.sort = state.sort;
    this.state.query.limit = state.limit;
    this.state.query.skip = state.skip || 0;
    this.state.query.project = state.project;
    this.state.query.collation = state.collation;
    this.state.query.maxTimeMS = state.maxTimeMS;

    if (
      this.state.status === DOCUMENTS_STATUS_FETCHED_INITIAL ||
      this.state.status === DOCUMENTS_STATUS_FETCHED_CUSTOM
    ) {
      this.setState({ outdated: true });
    }
  }

  /**
   * Copy the document to the clipboard.
   *
   * @param {HadronDocument} doc - The document.
   *
   * @returns {Boolean} If the copy succeeded.
   */
  copyToClipboard(doc: Document) {
    track('Document Copied', { mode: this.modeForTelemetry() });
    const documentEJSON = doc.toEJSON();
    // eslint-disable-next-line no-undef
    void navigator.clipboard.writeText(documentEJSON);
  }

  /**
   * Remove the provided document from the collection.
   *
   * @param {Document} doc - The hadron document.
   */
  async removeDocument(doc: Document) {
    track('Document Deleted', { mode: this.modeForTelemetry() });
    const id = doc.getId();
    if (id !== undefined) {
      doc.emit('remove-start');
      try {
        await this.dataService.deleteOne(this.state.ns, { _id: id } as any);
        // emit on the document(list view) and success state(json view)
        doc.emit('remove-success');
        const payload = { view: this.state.view, ns: this.state.ns };
        this.localAppRegistry.emit('document-deleted', payload);
        this.globalAppRegistry.emit('document-deleted', payload);
        const index = this.findDocumentIndex(doc);
        this.state.docs?.splice(index, 1);
        this.setState({
          count: this.state.count === null ? null : this.state.count - 1,
          end: Math.max(this.state.end - 1, 0),
        });
      } catch (error) {
        // emit on the document(list view) and success state(json view)
        doc.emit('remove-error', (error as Error).message);
        this.trigger(this.state);
      }
    } else {
      doc.emit('remove-error', DELETE_ERROR);
      this.trigger(this.state);
    }
  }

  /**
   * Ensure that updating the given document is allowed
   * (currently only in the sense that for CSFLE-enabled clients,
   * there is no risk of writing back unencrypted data).
   * If this is not the case, returns false and emit `update-error`
   * on the document object.
   *
   * @param {string} ns The collection namespace
   * @param {Document} doc A HadronDocument instance
   * @returns {boolean} Whether updating is allowed.
   */
  async _verifyUpdateAllowed(ns: string, doc: Document) {
    if (this.dataService.getCSFLEMode?.() === 'enabled') {
      // Editing the document and then being informed that
      // doing so is disallowed might not be great UX, but
      // since we are mostly targeting typical FLE2 use cases,
      // it's probably not worth spending too much time on this.
      const isAllowed = await this.dataService.isUpdateAllowed(
        ns,
        doc.generateOriginalObject()
      );
      if (!isAllowed) {
        doc.emit(
          'update-error',
          'Update blocked as it could unintentionally write unencrypted data due to a missing or incomplete schema.'
        );
        return false;
      }
    }
    return true;
  }

  /**
   * Update the provided document unless the elements being changed were
   * changed in the background. If the elements being changed were changed
   * in the background, block the update.
   *
   * @param {Document} doc - The hadron document.
   */
  async updateDocument(doc: Document) {
    track('Document Updated', { mode: this.modeForTelemetry() });
    try {
      doc.emit('update-start');
      // We add the shard keys here, if there are any, because that is
      // required for updated documents in sharded collections.
      const { query, updateDoc } =
        doc.generateUpdateUnlessChangedInBackgroundQuery(
          // '.' in shard keys means nested doc
          {
            alwaysIncludeKeys: Object.keys(this.state.shardKeys || {}).map(
              (key) => key.split('.')
            ),
          }
        );
      debug('Performing findOneAndUpdate', { query, updateDoc });

      if (Object.keys(updateDoc).length === 0) {
        doc.emit('update-error', EMPTY_UPDATE_ERROR.message);
        return;
      }

      if (!(await this._verifyUpdateAllowed(this.state.ns, doc))) {
        // _verifyUpdateAllowed emitted update-error
        return;
      }
      const [error, d] = await findAndModifyWithFLEFallback(
        this.dataService,
        this.state.ns,
        query,
        updateDoc,
        'update'
      );

      if (error) {
        if (
          error.codeName === 'InvalidPipelineOperator' &&
          error.message.match(/\$[gs]etField/)
        ) {
          const nbsp = '\u00a0';
          error.message += ` (Updating fields whose names contain dots or start with $ require MongoDB${nbsp}5.0 or above.)`;
        }
        doc.emit('update-error', error.message);
      } else if (d) {
        doc.emit('update-success', d);
        this.localAppRegistry.emit('document-updated', this.state.view);
        this.globalAppRegistry.emit('document-updated', this.state.view);
        const index = this.findDocumentIndex(doc);
        this.state.docs![index] = new HadronDocument(d);
        this.trigger(this.state);
      } else {
        doc.emit('update-blocked');
      }
    } catch (err: any) {
      doc.emit(
        'update-error',
        `An error occured when attempting to update the document: ${String(
          err.message
        )}`
      );
    }
  }

  /**
   * Replace the document in the database with the provided document.
   *
   * @param {Document} doc - The hadron document.
   */
  async replaceDocument(doc: Document) {
    track('Document Updated', { mode: this.modeForTelemetry() });
    try {
      doc.emit('update-start');

      if (!(await this._verifyUpdateAllowed(this.state.ns, doc))) {
        // _verifyUpdateAllowed emitted update-error
        return;
      }

      const object = doc.generateObject();
      const queryKeyInclusionOptions: Mutable<
        Parameters<
          typeof doc.getQueryForOriginalKeysAndValuesForSpecifiedKeys
        >[0]
      > = {
        alwaysIncludeKeys: [
          ['_id'],
          // '.' in shard keys means nested doc
          ...Object.keys(this.state.shardKeys || {}).map((key) =>
            key.split('.')
          ),
        ],
      };

      if (
        this.dataService.getCSFLEMode &&
        this.dataService.getCSFLEMode() === 'enabled'
      ) {
        const knownSchemaForCollection =
          await this.dataService.knownSchemaForCollection(this.state.ns);

        // The find/query portion will typically exclude encrypted fields,
        // because those cannot be queried to make sure that the original
        // value matches the current one; however, if we know that the
        // field is equality-searchable, we can (and should) still include it.
        queryKeyInclusionOptions.includableEncryptedKeys =
          knownSchemaForCollection.encryptedFields.equalityQueryableEncryptedFields;

        if (
          object.__safeContent__ &&
          isEqual(
            object.__safeContent__,
            doc.generateOriginalObject().__safeContent__
          ) &&
          knownSchemaForCollection.hasSchema
        ) {
          // SERVER-66662 blocks writes of __safeContent__ for queryable-encryption-enabled
          // collections. We remove it unless it was edited, in which case we assume that the
          // user really knows what they are doing.
          delete object.__safeContent__;
        }
      }

      const query = doc.getQueryForOriginalKeysAndValuesForSpecifiedKeys(
        queryKeyInclusionOptions
      );
      debug('Performing findOneAndReplace', { query, object });

      const [error, d] = await findAndModifyWithFLEFallback(
        this.dataService,
        this.state.ns,
        query,
        object,
        'replace'
      );
      if (error) {
        doc.emit('update-error', error.message);
      } else {
        doc.emit('update-success', d);
        this.localAppRegistry.emit('document-updated', this.state.view);
        this.globalAppRegistry.emit('document-updated', this.state.view);
        const index = this.findDocumentIndex(doc);
        this.state.docs![index] = new HadronDocument(d);
        this.trigger(this.state);
      }
    } catch (err: any) {
      doc.emit(
        'update-error',
        `An error occured when attempting to update the document: ${String(
          err.message
        )}`
      );
    }
  }

  /**
   * Set if the default comment should be displayed.
   *
   * @param {Boolean} isCommentNeeded - Is a comment needed or not.
   */
  updateComment(isCommentNeeded: boolean) {
    const insert = { ...this.state.insert, isCommentNeeded };
    this.setState({ insert });
  }

  /**
   * Find the index of the document in the list.
   *
   * @param {Document} doc - The hadron document.
   *
   * @returns {String} Document Index from the list.
   */
  findDocumentIndex(doc: Document) {
    return findIndex(this.state.docs, (d) => {
      return doc.getStringId() === d.getStringId();
    });
  }

  /**
   * When the next page button is clicked, need to load the next 20 documents.
   *
   * @param {Number} page - The page that is being shown.
   */
  async getPage(page: number) {
    const { ns, status, view } = this.state;

    if (page < 0) {
      return;
    }

    if (status === DOCUMENTS_STATUS_FETCHING) {
      return;
    }

    const {
      filter,
      limit,
      sort,
      project: projection,
      collation,
      maxTimeMS,
    } = this.state.query;

    const skip = this.state.query.skip + page * NUM_PAGE_DOCS;

    // nextPageCount will be the number of docs to load
    let nextPageCount = NUM_PAGE_DOCS;

    // Make sure we don't go past the limit if a limit is set
    if (limit) {
      const remaining = limit - skip;
      if (remaining < 1) {
        return;
      }
      if (remaining < nextPageCount) {
        nextPageCount = remaining;
      }
    }

    const abortController = new AbortController();
    const signal = abortController.signal;

    const opts = {
      signal,
      skip,
      limit: nextPageCount,
      sort,
      projection,
      collation,
      maxTimeMS: capMaxTimeMSAtPreferenceLimit(maxTimeMS),
      promoteValues: false,
      bsonRegExp: true,
    };

    this.setState({
      status: DOCUMENTS_STATUS_FETCHING,
      abortController,
      error: null,
    });

    const cancelDebounceLoad = this.debounceLoading();

    let error: Error | undefined;
    let documents: BSONObject[];
    try {
      documents = await findDocuments(
        this.dataService,
        ns,
        filter,
        opts as any
      );
    } catch (err: any) {
      documents = [];
      error = err;
    }

    const length = error ? 0 : documents.length;
    this.setState({
      error,
      status: error
        ? DOCUMENTS_STATUS_ERROR
        : DOCUMENTS_STATUS_FETCHED_PAGINATION,
      docs: documents.map((doc: BSONObject) => new HadronDocument(doc)),
      start: skip + 1,
      end: skip + length,
      page,
      table: this.getInitialTableState(),
      resultId: resultId(),
      abortController: null,
    });
    this.localAppRegistry.emit('documents-paginated', view, documents);
    this.globalAppRegistry.emit('documents-paginated', view, documents);

    cancelDebounceLoad();
  }

  /**
   * Closing the insert document dialog just resets the state to the default.
   */
  closeInsertDocumentDialog() {
    this.setState({
      insert: this.getInitialInsertState(),
    });
  }

  /**
   * Open the insert document dialog.
   *
   * @param {Object} doc - The document to insert.
   * @param {Boolean} clone - Whether this is a clone operation.
   */
  async openInsertDocumentDialog(doc: BSONObject, clone: boolean) {
    const hadronDoc = new HadronDocument(doc, false);

    if (clone) {
      track('Document Cloned', { mode: this.modeForTelemetry() });
      // We need to remove the _id or we will get an duplicate key error on
      // insert, and we currently do not allow editing of the _id field.
      for (const element of hadronDoc.elements) {
        if (element.currentKey === '_id') {
          hadronDoc.elements.remove(element);
          break;
        }
      }
    }

    const csfleState: InsertState['csfleState'] = { state: 'none' };
    const dataServiceCSFLEMode =
      this.dataService &&
      this.dataService.getCSFLEMode &&
      this.dataService.getCSFLEMode();
    if (dataServiceCSFLEMode === 'enabled') {
      // Show a warning if this is a CSFLE-enabled connection but this
      // collection does not have a schema.
      const {
        hasSchema,
        encryptedFields: { encryptedFields },
      } = await this.dataService.knownSchemaForCollection(this.state.ns);
      if (encryptedFields.length > 0) {
        // This is for displaying encrypted fields to the user. We do not really
        // need to worry about the distinction between '.' as a nested-field
        // indicator and '.' as a literal part of a field name here, esp. since
        // automatic Queryable Encryption does not support '.' in field names at all.
        csfleState.encryptedFields = encryptedFields.map((field) =>
          field.join('.')
        );
      }
      if (!hasSchema) {
        csfleState.state = 'no-known-schema';
      } else if (
        !(await this.dataService.isUpdateAllowed(this.state.ns, doc))
      ) {
        csfleState.state = 'incomplete-schema-for-cloned-doc';
      } else {
        csfleState.state = 'has-known-schema';
      }
    } else if (dataServiceCSFLEMode === 'disabled') {
      csfleState.state = 'csfle-disabled';
    }

    const jsonDoc = hadronDoc.toEJSON();

    this.setState({
      insert: {
        doc: hadronDoc,
        jsonDoc: jsonDoc,
        jsonView: true,
        message: '',
        csfleState,
        mode: MODIFYING,
        isOpen: true,
        isCommentNeeded: true,
      },
    });
  }

  /**
   * Open an import file dialog from compass-import-export-plugin.
   * Emits a global app registry event the plugin listens to.
   */
  openImportFileDialog() {
    this.globalAppRegistry.emit('open-import', {
      namespace: this.state.ns,
      origin: 'empty-state',
    });
  }

  /**
   * Open an export file dialog from compass-import-export-plugin.
   * Emits a global app registry event the plugin listens to.
   */
  openExportFileDialog(exportFullCollection?: boolean) {
    const { filter, project, collation, limit, skip, sort } = this.state.query;

    this.globalAppRegistry.emit('open-export', {
      namespace: this.state.ns,
      query: { filter, project, collation, limit, skip, sort },
      exportFullCollection,
      origin: 'crud-toolbar',
    });
  }

  /**
   * Switch between list and JSON views when inserting a document through Insert Document modal.
   *
   * Also modifies doc and jsonDoc states to keep accurate data for each view.
   * @param {String} view - view we are switching to.
   */
  toggleInsertDocument(view: CrudState['view']) {
    if (view === 'JSON') {
      const jsonDoc = this.state.insert.doc?.toEJSON();

      this.setState({
        insert: {
          doc: this.state.insert.doc,
          jsonView: true,
          jsonDoc: jsonDoc ?? null,
          message: '',
          csfleState: this.state.insert.csfleState,
          mode: MODIFYING,
          isOpen: true,
          isCommentNeeded: this.state.insert.isCommentNeeded,
        },
      });
    } else {
      let hadronDoc;

      if (this.state.insert.jsonDoc === '') {
        hadronDoc = this.state.insert.doc;
      } else {
        hadronDoc = HadronDocument.FromEJSON(this.state.insert.jsonDoc ?? '');
      }

      this.setState({
        insert: {
          doc: hadronDoc,
          jsonView: false,
          jsonDoc: this.state.insert.jsonDoc,
          message: '',
          csfleState: this.state.insert.csfleState,
          mode: MODIFYING,
          isOpen: true,
          isCommentNeeded: this.state.insert.isCommentNeeded,
        },
      });
    }
  }

  /**
   * Toggle just the jsonView insert state.
   *
   * @param {String} view - view we are switching to.
   */
  toggleInsertDocumentView(view: CrudState['view']) {
    const jsonView = view === 'JSON';
    this.setState({
      insert: {
        doc: new Document({}),
        jsonDoc: this.state.insert.jsonDoc,
        jsonView: jsonView,
        message: '',
        csfleState: this.state.insert.csfleState,
        mode: MODIFYING,
        isOpen: true,
        isCommentNeeded: this.state.insert.isCommentNeeded,
      },
    });
  }

  /**
   * As we are editing a JSON document in Insert Document Dialog, update the
   * state with the inputed json data.
   *
   * @param {String} value - JSON string we are updating.
   */
  updateJsonDoc(value: string | null) {
    this.setState({
      insert: {
        doc: new Document({}),
        jsonDoc: value,
        jsonView: true,
        message: '',
        csfleState: this.state.insert.csfleState,
        mode: MODIFYING,
        isOpen: true,
        isCommentNeeded: this.state.insert.isCommentNeeded,
      },
    });
  }

  /**
   * Insert a single document.
   */
  async insertMany() {
    const docs = HadronDocument.FromEJSONArray(
      this.state.insert.jsonDoc ?? ''
    ).map((doc) => doc.generateObject());
    track('Document Inserted', {
      mode: this.state.insert.jsonView ? 'json' : 'field-by-field',
      multiple: docs.length > 1,
    });

    try {
      await this.dataService.insertMany(this.state.ns, docs);
      // track mode for analytics events
      const payload = {
        ns: this.state.ns,
        view: this.state.view,
        mode: this.state.insert.jsonView ? 'json' : 'default',
        multiple: true,
        docs,
      };
      this.localAppRegistry.emit('document-inserted', payload);
      this.globalAppRegistry.emit('document-inserted', payload);

      this.state.insert = this.getInitialInsertState();
    } catch (error) {
      this.setState({
        insert: {
          doc: new Document({}),
          jsonDoc: this.state.insert.jsonDoc,
          jsonView: true,
          message: (error as Error).message,
          csfleState: this.state.insert.csfleState,
          mode: ERROR,
          isOpen: true,
          isCommentNeeded: this.state.insert.isCommentNeeded,
        },
      });
    }

    // Since we are inserting a bunch of documents and we need to rerun all
    // the queries and counts for them, let's just refresh the whole set of
    // documents.
    void this.refreshDocuments();
  }

  /**
   * Insert the document given the document in current state.
   * Parse document from Json Insert View Modal or generate object from hadron document
   * view to insert.
   */
  async insertDocument() {
    track('Document Inserted', {
      mode: this.state.insert.jsonView ? 'json' : 'field-by-field',
      multiple: false,
    });

    let doc: BSONObject;

    if (this.state.insert.jsonView) {
      doc = HadronDocument.FromEJSON(
        this.state.insert.jsonDoc ?? ''
      ).generateObject();
    } else {
      doc = this.state.insert.doc!.generateObject();
    }
    try {
      await this.dataService.insertOne(this.state.ns, doc);

      const payload = {
        ns: this.state.ns,
        view: this.state.view,
        mode: this.state.insert.jsonView ? 'json' : 'default',
        multiple: false,
        docs: [doc],
      };
      this.localAppRegistry.emit('document-inserted', payload);
      this.globalAppRegistry.emit('document-inserted', payload);

      this.state.insert = this.getInitialInsertState();
    } catch (error) {
      this.setState({
        insert: {
          doc: this.state.insert.doc,
          jsonDoc: this.state.insert.jsonDoc,
          jsonView: this.state.insert.jsonView,
          message: (error as Error).message,
          csfleState: this.state.insert.csfleState,
          mode: ERROR,
          isOpen: true,
          isCommentNeeded: this.state.insert.isCommentNeeded,
        },
      });
      return;
    }

    void this.refreshDocuments();
  }

  /**
   * The user has drilled down into a new element.
   *
   * @param {HadronDocument} doc - The parent document.
   * @param {Element} element - The element being drilled into.
   * @param {Object} editParams - If we need to open a cell for editing, the coordinates.
   */
  drillDown(
    doc: Document,
    element: Element,
    editParams: TableState['editParams'] = null
  ) {
    this.setState({
      table: {
        path: this.state.table.path.concat([element.currentKey]),
        types: this.state.table.types.concat([element.currentType]),
        doc,
        editParams,
      },
    });
  }

  /**
   * The path of the table view has changed.
   *
   * @param {Array} path - A list of fieldnames and indexes.
   * @param {Array} types - A list of the types of each path segment.
   */
  pathChanged(path: (string | number)[], types: TableHeaderType[]) {
    this.setState({
      table: {
        doc: this.state.table.doc,
        editParams: this.state.table.editParams,
        path: path,
        types: types,
      },
    });
  }

  /**
   * The view has changed.
   *
   * @param {String} view - The new view.
   */
  viewChanged(view: CrudState['view']) {
    this.globalAppRegistry.emit('document-view-changed', view);
    this.localAppRegistry.emit('document-view-changed', view);
    this.setState({ view: view });
  }

  /**
   * Detect if it is safe to perform the count query optimisation where we
   * specify the _id_ index as the hint.
   */
  isCountHintSafe() {
    const { isTimeSeries, query } = this.state;
    const { filter } = query;

    if (isTimeSeries) {
      // timeseries collections don't have the _id_ filter, so we can't use the hint speedup
      return false;
    }

    if (filter && Object.keys(filter).length) {
      // we can't safely use the hint speedup if there's a filter
      return false;
    }

    return true;
  }

  /**
   * Checks if the initial query was not modified.
   *
   * @param {Object} query - The query to check.
   *
   * @returns {Boolean}
   */
  isInitialQuery(query: Partial<QueryState>): boolean {
    return (
      isEmpty(query.filter) &&
      isEmpty(query.project) &&
      isEmpty(query.collation)
    );
  }

  /**
   * This function is called when the collection filter changes.
   */
  async refreshDocuments(onApply = false) {
    if (this.dataService && !this.dataService.isConnected()) {
      log.warn(
        mongoLogId(1_001_000_072),
        'Documents',
        'Trying to refresh documents but dataService is disconnected'
      );
      return;
    }

    const { ns, status, view, query } = this.state;

    if (status === DOCUMENTS_STATUS_FETCHING) {
      return;
    }

    if (onApply) {
      const { query, isTimeSeries, isReadonly } = this.state;
      track('Query Executed', {
        has_projection:
          !!query.project && Object.keys(query.project).length > 0,
        has_skip: query.skip > 0,
        has_limit: query.limit > 0,
        has_collation: !!query.collation,
        changed_maxtimems: query.maxTimeMS !== DEFAULT_INITIAL_MAX_TIME_MS,
        collection_type: isTimeSeries
          ? 'time-series'
          : isReadonly
          ? 'readonly'
          : 'collection',
        used_regex: objectContainsRegularExpression(query.filter),
      });
    }

    // pass the signal so that the queries can close their own cursors and
    // reject their promises
    const abortController = new AbortController();
    const signal = abortController.signal;

    const fetchShardingKeysOptions = {
      maxTimeMS: capMaxTimeMSAtPreferenceLimit(query.maxTimeMS),
      signal,
    };

    const countOptions: Parameters<typeof countDocuments>[3] = {
      skip: query.skip,
      maxTimeMS: capMaxTimeMSAtPreferenceLimit(
        query.maxTimeMS > COUNT_MAX_TIME_MS_CAP
          ? COUNT_MAX_TIME_MS_CAP
          : query.maxTimeMS
      ),
      signal,
    };

    if (this.isCountHintSafe()) {
      countOptions.hint = '_id_';
    }

    const findOptions = {
      sort: query.sort,
      projection: query.project,
      skip: query.skip,
      limit: NUM_PAGE_DOCS,
      collation: query.collation,
      maxTimeMS: capMaxTimeMSAtPreferenceLimit(query.maxTimeMS),
      promoteValues: false,
      bsonRegExp: true,
      signal,
    };

    // only set limit if it's > 0, read-only views cannot handle 0 limit.
    if (query.limit > 0) {
      countOptions.limit = query.limit;
      findOptions.limit = Math.min(NUM_PAGE_DOCS, query.limit);
    }

    log.info(mongoLogId(1_001_000_073), 'Documents', 'Refreshing documents', {
      ns,
      withFilter: !isEmpty(query.filter),
      findOptions,
      countOptions,
    });

    // Don't wait for the count to finish. Set the result asynchronously.
    countDocuments(this.dataService, ns, query.filter, countOptions)
      .then((count) => this.setState({ count, loadingCount: false }))
      .catch((err) => {
        // countDocuments already swallows all db errors and returns null. The
        // only known error it can throw is AbortError. If
        // something new does appear we probably shouldn't swallow it.
        if (!this.dataService.isCancelError(err)) {
          throw err;
        }
        this.setState({ loadingCount: false });
      });

    const promises = [
      fetchShardingKeys(this.dataService, ns, fetchShardingKeysOptions),
      findDocuments(this.dataService, ns, query.filter, findOptions as any),
    ] as const;

    // This is so that the UI can update to show that we're fetching
    this.setState({
      status: DOCUMENTS_STATUS_FETCHING,
      abortController,
      outdated: false,
      error: null,
      count: null, // we don't know the new count yet
      loadingCount: true,
    });

    // don't start showing the loading indicator and cancel button immediately
    const cancelDebounceLoad = this.debounceLoading();

    const stateChanges = {};

    try {
      const [shardKeys, docs] = await Promise.all(promises);

      setIsEditable(this, this.hasProjection(query));

      Object.assign(stateChanges, {
        status: this.isInitialQuery(query)
          ? DOCUMENTS_STATUS_FETCHED_INITIAL
          : DOCUMENTS_STATUS_FETCHED_CUSTOM,
        error: null,
        docs: docs.map((doc) => new HadronDocument(doc)),
        page: 0,
        start: docs.length > 0 ? 1 : 0,
        end: docs.length,
        table: this.getInitialTableState(),
        shardKeys,
      });

      this.localAppRegistry.emit('documents-refreshed', view, docs);
      this.globalAppRegistry.emit('documents-refreshed', view, docs);
    } catch (error) {
      log.error(
        mongoLogId(1_001_000_074),
        'Documents',
        'Failed to refresh documents',
        error
      );
      Object.assign(stateChanges, {
        error,
        status: DOCUMENTS_STATUS_ERROR,
      });
    }

    // cancel the debouncing status if we load before the timer fires
    cancelDebounceLoad();

    Object.assign(stateChanges, {
      abortController: null,
      resultId: resultId(),
    });

    // Trigger all the accumulated changes once at the end
    this.setState(stateChanges);
  }

  cancelOperation() {
    // As we use same controller for all operations
    // (find, count and shardingKeys), aborting will stop all.
    this.state.abortController?.abort(new Error('This operation was aborted'));
    this.setState({ abortController: null });
  }

  debounceLoading() {
    this.setState({ debouncingLoad: true });

    const debouncePromise = new Promise((resolve) => {
      setTimeout(resolve, 200); // 200ms should feel about instant
    });

    let cancelDebounceLoad: () => void;
    const loadPromise = new Promise<void>((resolve) => {
      cancelDebounceLoad = resolve;
    });

    void Promise.race([debouncePromise, loadPromise]).then(() => {
      this.setState({ debouncingLoad: false });
    });

    return cancelDebounceLoad!;
  }

  hasProjection(query: BSONObject) {
    return !!(query.project && Object.keys(query.project).length > 0);
  }

  /**
   * Set the data service on the store.
   *
   * @param {Error} error - The error connecting.
   * @param {DataService} dataService - The data service.
   */
  setDataService(error: Error | undefined | null, dataService: DataService) {
    if (!error) {
      this.dataService = dataService;
    }
  }
}

export type CrudStore = Store & CrudStoreImpl & { gridStore: GridStore };

/**
 * Configure the main CRUD store.
 *
 * @param {Object} options - Options object to configure store. Defaults to {}.
 *
 * @returns {Object} Configured compass-crud store with initial states.
 */
const configureStore = (options: CrudStoreOptions & GridStoreOptions) => {
  const store = Reflux.createStore(new CrudStoreImpl(options)) as CrudStore;

  // Set the app registry if preset. This must happen first.
  if (options.localAppRegistry) {
    const localAppRegistry = options.localAppRegistry;

    localAppRegistry.on('query-changed', store.onQueryChanged.bind(store));
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    localAppRegistry.on('refresh-data', store.refreshDocuments.bind(store));

    localAppRegistry.on('fields-changed', store.updateFields.bind(store));

    setLocalAppRegistry(store, options.localAppRegistry);
  }

  // Set global app registry to get status actions.
  if (options.globalAppRegistry) {
    const globalAppRegistry = options.globalAppRegistry;

    const instanceStore: any = globalAppRegistry.getStore('App.InstanceStore');
    const instance = instanceStore.getState().instance;

    const instanceState: Partial<CrudState> = {
      isWritable: instance.isWritable,
      instanceDescription: instance.description,
      version: instance.build.version,
    };
    if (instance.dataLake.isDataLake) {
      instanceState.isDataLake = true;
    }
    store.setState(instanceState);

    // these can change later
    instance.on('change:isWritable', () => {
      store.setState({ isWritable: instance.isWritable });
    });

    instance.on('change:description', () => {
      store.setState({ instanceDescription: instance.description });
    });

    globalAppRegistry.on('refresh-data', () => {
      void store.refreshDocuments();
    });

    globalAppRegistry.on('import-finished', ({ ns }) => {
      if (ns === store.state.ns) {
        void store.refreshDocuments();
      }
    });

    setGlobalAppRegistry(store, globalAppRegistry);
  }

  if (options.isReadonly !== null && options.isReadonly !== undefined) {
    setIsReadonly(store, options.isReadonly);
  }

  if (options.namespace) {
    setNamespace(store, options.namespace);
  }

  if (options.isTimeSeries) {
    setIsTimeSeries(store, options.isTimeSeries);
  }

  if (options.dataProvider) {
    setDataProvider(
      store,
      options.dataProvider.error,
      options.dataProvider.dataProvider as DataService
    );

    if (!options.noRefreshOnConfigure) {
      void store.refreshDocuments();
    }
  }

  const gridStore = configureGridStore(options);
  store.gridStore = gridStore;

  return store;
};

export default configureStore;

function resultId() {
  return Math.floor(Math.random() * 2 ** 53);
}

type ErrorOrResult =
  | [
      error: { message: string; code?: number; codeName?: string },
      result: undefined
    ]
  | [error: undefined | null, result: BSONObject];
export async function findAndModifyWithFLEFallback(
  ds: DataService,
  ns: string,
  query: BSONObject,
  object: { $set?: BSONObject; $unset?: BSONObject } | BSONObject | BSONArray,
  modificationType: 'update' | 'replace'
): Promise<ErrorOrResult> {
  const findOneAndModifyMethod =
    modificationType === 'update' ? 'findOneAndUpdate' : 'findOneAndReplace';
  let error: (Error & { codeName?: string; code?: any }) | undefined;

  try {
    return [
      undefined,
      await ds[findOneAndModifyMethod](ns, query, object, {
        returnDocument: 'after',
        promoteValues: false,
      }),
    ] as ErrorOrResult;
  } catch (e) {
    error = e as Error;
  }

  if (
    error.codeName === 'ShardKeyNotFound' ||
    +(error?.code ?? 0) === 63714_02 // 6371402 is "'findAndModify with encryption only supports new: false'"
  ) {
    const modifyOneMethod =
      modificationType === 'update' ? 'updateOne' : 'replaceOne';

    try {
      await ds[modifyOneMethod](ns, query, object);
    } catch (e) {
      // Return the modifyOneMethod error here
      // since we already know the original error from findOneAndModifyMethod
      // and want to know what went wrong with the fallback method,
      // e.g. return the `Found indexed encrypted fields but could not find __safeContent__` error.
      return [e, undefined] as ErrorOrResult;
    }

    try {
      const docs = await ds.find(
        ns,
        { _id: query._id as any },
        { promoteValues: false }
      );
      return [undefined, docs[0]] as ErrorOrResult;
    } catch (e) {
      /* fallthrough */
    }
  }

  // Race condition -- most likely, somebody else
  // deleted the document between the findAndModify command
  // and the find command. Just return the original error.
  return [error, undefined] as ErrorOrResult;
}
