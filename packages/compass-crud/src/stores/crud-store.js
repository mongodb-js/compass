import Reflux from 'reflux';
import toNS from 'mongodb-ns';
import { findIndex, isEmpty } from 'lodash';
import StateMixin from 'reflux-state-mixin';
import HadronDocument from 'hadron-document';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';

import {
  findDocuments,
  countDocuments,
  fetchShardingKeys,
  OPERATION_CANCELLED_MESSAGE
} from '../utils';

import {
  DOCUMENTS_STATUS_INITIAL,
  DOCUMENTS_STATUS_FETCHING,
  DOCUMENTS_STATUS_ERROR,
  DOCUMENTS_STATUS_FETCHED_INITIAL,
  DOCUMENTS_STATUS_FETCHED_CUSTOM,
  DOCUMENTS_STATUS_FETCHED_PAGINATION
} from '../constants/documents-statuses';

import configureGridStore from './grid-store';

const { log, mongoLogId, track } = createLoggerAndTelemetry('COMPASS-CRUD-UI');

function pickQueryProps({
  filter,
  sort,
  limit,
  skip,
  maxTimeMS,
  project,
  collation,
} = {}) {
  const query = { filter, sort, limit, skip, maxTimeMS, project, collation };
  for (const key of Object.keys(query)) {
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
 * Input type.
 */
const TYPE = 'text';

/**
 * Styles attribute.
 */
const STYLES = 'styles';

/**
 * Input display.
 */
const DISPLAY = 'display: none;';

/**
 * Input type.
 */
const INPUT = 'input';

/**
 * Copy command.
 */
const COPY = 'copy';

/**
 * The delete error message.
 */
const DELETE_ERROR = new Error('Cannot delete documents that do not have an _id field.');

/**
 * The empty update error message.
 */
const EMPTY_UPDATE_ERROR = new Error('Unable to update, no changes have been made.');

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
export const setDataProvider = (store, error, provider) => {
  store.setDataService(error, provider);
};

/**
 * Set the isReadonly flag in the store.
 *
 * @param {Store} store - The store.
 * @param {Boolean} isReadonly - If the collection is readonly.
 */
export const setIsReadonly = (store, isReadonly) => {
  store.onReadonlyChanged(isReadonly);
};

/**
 * Set the isTimeSeries flag in the store.
 *
 * @param {Store} store - The store.
 * @param {Boolean} isTimeSeries - If the collection is a time-series collection.
 */
export const setIsTimeSeries = (store, isTimeSeries) => {
  store.onTimeSeriesChanged(isTimeSeries);
};

/**
 * Set the namespace in the store.
 *
 * @param {Store} store - The store.
 * @param {String} ns - The namespace in "db.collection" format.
 */
export const setNamespace = (store, ns) => {
  store.onCollectionChanged(ns);
};

/**
 * Set the global app registry.
 *
 * @param {Store} store - The store.
 * @param {AppRegistry} appRegistry - The app registry.
 */
export const setGlobalAppRegistry = (store, appRegistry) => {
  store.globalAppRegistry = appRegistry;
};

/**
 * Set the local app registry.
 *
 * @param {Store} store - The store.
 * @param {AppRegistry} appRegistry - The app registry.
 */
export const setLocalAppRegistry = (store, appRegistry) => {
  store.localAppRegistry = appRegistry;
};

/**
 * Configure the main CRUD store.
 *
 * @param {Object} options - Options object to configure store. Defaults to {}.
 *
 * @returns {Object} Configured compass-crud store with initial states.
 */
const configureStore = (options = {}) => {
  const store = Reflux.createStore({
    mixins: [StateMixin.store],
    listenables: options.actions,

    /**
     * Get the initial state of the store.
     *
     * @returns {Object} The state.
     */
    getInitialState() {
      return {
        ns: '',
        collection: '',
        abortController: null,
        sessions: null,
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
        resultId: resultId()
      };
    },

    /**
     * Get the initial insert state.
     *
     * @returns {Object} The initial insert state.
     */
    getInitialInsertState() {
      return {
        doc: null,
        jsonDoc: null,
        message: '',
        csfleState: 'none',
        mode: MODIFYING,
        jsonView: false,
        isOpen: false,
        isCommentNeeded: true
      };
    },

    /**
     * Get the initial table state.
     *
     * @returns {Object} The initial table state.
     */
    getInitialTableState() {
      return {
        doc: null,
        path: [],
        types: [],
        editParams: null
      };
    },

    /**
     * Get the initial query state.
     *
     * @returns {Object} The initial query state.
     */
    getInitialQueryState() {
      return {
        filter: {},
        sort: null,
        limit: 0,
        skip: 0,
        maxTimeMS: DEFAULT_INITIAL_MAX_TIME_MS,
        project: null,
        collation: null,
        ...pickQueryProps(options.query ?? {})
      };
    },

    /**
     * Returns the current view in the format used for telemetry
     * ('list', 'json', 'table'). Grouped here so that this is easy
     * to update if the labels change at some point.
     */
    modeForTelemetry() {
      return this.state.view.toLowerCase();
    },

    /**
     * Handle the instance changing.
     *
     * @param {Object} instance - MongoDB instance model.
     */
    onInstanceCreated(instance) {
      instance.build.on('change:version', (model, version) => {
        this.setState({ version });
      });

      instance.dataLake.on('change:isDataLake', (model, isDataLake) => {
        if (isDataLake) {
          this.setState({ isDataLake, isEditable: false });
        }
      });
    },

    /**
     * Set if the collection is readonly.
     *
     * @param {Boolean} isReadonly - If the collection is readonly.
     */
    onReadonlyChanged(isReadonly) {
      this.setState({ isReadonly });
    },

    /**
     * Set if the collection is a time-series collection.
     *
     * @param {Boolean} isTimeSeries - If the collection is time-series.
     */
    onTimeSeriesChanged(isTimeSeries) {
      this.setState({ isTimeSeries });
    },

    /**
     * Plugin lifecycle method that is called when the namespace changes in
     * Compass. Trigger with new namespace and cleared path/types.
     *
     * @param {String} ns - The new namespace.
     */
    onCollectionChanged(ns) {
      const nsobj = toNS(ns);
      const editable = this.isListEditable();
      this.setState({
        ns: ns,
        collection: nsobj.collection,
        isEditable: editable,
        table: this.getInitialTableState(),
        query: this.getInitialQueryState()
      });
    },

    /**
     * Fires when the query is changed.
     *
     * @param {Object} state - The query state.
     */
    onQueryChanged(state) {
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
    },

    /**
     * Determine if the document list is editable.
     *
     * @returns {Boolean} If the list is editable.
     */
    isListEditable() {
      return !this.state.isDataLake &&
        !this.state.isReadonly &&
        process.env.HADRON_READONLY !== 'true';
    },

    /**
     * Copy the document to the clipboard.
     *
     * @param {HadronDocument} doc - The document.
     *
     * @returns {Boolean} If the copy succeeded.
     */
    copyToClipboard(doc) {
      track('Document Copied', { mode: this.modeForTelemetry() });
      const documentJSON = doc.toEJSON();
      let input = document.createElement(INPUT);
      input.type = TYPE;
      input.setAttribute(STYLES, DISPLAY);
      input.value = documentJSON;
      document.body.appendChild(input);
      input.select();
      const success = document.execCommand(COPY);
      document.body.removeChild(input);
      input = null;
      return success;
    },

    /**
     * Remove the provided document from the collection.
     *
     * @param {Document} doc - The hadron document.
     */
    removeDocument(doc) {
      track('Document Deleted', { mode: this.modeForTelemetry() });
      const id = doc.getId();
      if (id !== undefined) {
        this.dataService.deleteOne(this.state.ns, { _id: id }, {}, (error) => {
          if (error) {
            // emit on the document(list view) and success state(json view)
            doc.emit('remove-error', error.message);
            this.trigger(this.state);
          } else {
            // emit on the document(list view) and success state(json view)
            doc.emit('remove-success');

            const payload = { view: this.state.view, ns: this.state.ns };
            this.localAppRegistry.emit('document-deleted', payload);
            this.globalAppRegistry.emit('document-deleted', payload);
            const index = this.findDocumentIndex(doc);
            this.state.docs.splice(index, 1);
            this.setState({
              count: this.state.count - 1,
              end: Math.max(this.state.end - 1, 0)
            });
          }
        });
      } else {
        doc.emit('remove-error', DELETE_ERROR);
        this.trigger(this.state);
      }
    },

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
    async _verifyUpdateAllowed(ns, doc) {
      if (this.dataService.getCSFLEMode && this.dataService.getCSFLEMode() === 'enabled') {
        // Editing the document and then being informed that
        // doing so is disallowed might not be great UX, but
        // since we are mostly targeting typical FLE2 use cases,
        // it's probably not worth spending too much time on this.
        const isAllowed = await this.dataService.getCSFLECollectionTracker().isUpdateAllowed(
          ns, doc.generateOriginalObject());
        if (!isAllowed) {
          doc.emit('update-error', 'Update blocked as it could unintentionally write unencrypted data due to a missing or incomplete schema.');
          return false;
        }
      }
      return true;
    },

    /**
     * Update the provided document unless the elements being changed were
     * changed in the background. If the elements being changed were changed
     * in the background, block the update.
     *
     * @param {Document} doc - The hadron document.
     */
    async updateDocument(doc) {
      track('Document Updated', { mode: this.modeForTelemetry() });
      try {
        // We add the shard keys here, if there are any, because that is
        // required for updated documents in sharded collections.
        const {
          query,
          updateDoc
        } = doc.generateUpdateUnlessChangedInBackgroundQuery(this.state.shardKeys);

        if (Object.keys(updateDoc).length === 0) {
          doc.emit('update-error', EMPTY_UPDATE_ERROR.message);
          return;
        }

        if (!await this._verifyUpdateAllowed(this.state.ns, doc)) {
          // _verifyUpdateAllowed emitted update-error
          return;
        }
        const [ error, d ] = await findAndModifyWithFLEFallback(this.dataService, this.state.ns, (ds, ns, opts, cb) => {
          ds.findOneAndUpdate(ns, query, updateDoc, opts, cb);
        });

        if (error) {
          doc.emit('update-error', error.message);
        } else if (d) {
          doc.emit('update-success', d);
          this.localAppRegistry.emit('document-updated', this.state.view);
          this.globalAppRegistry.emit('document-updated', this.state.view);
          const index = this.findDocumentIndex(doc);
          this.state.docs[index] = new HadronDocument(d);
          this.trigger(this.state);
        } else {
          doc.emit('update-blocked');
        }
      } catch (err) {
        doc.emit('update-error', `An error occured when attempting to update the document: ${err.message}`);
      }
    },

    /**
     * Replace the document in the database with the provided document.
     *
     * @param {Document} doc - The hadron document.
     */
    async replaceDocument(doc) {
      track('Document Updated', { mode: this.modeForTelemetry() });
      try {
        const object = doc.generateObject();
        const query = doc.getOriginalKeysAndValuesForSpecifiedKeys({
          _id: 1,
          ...(this.state.shardKeys || {})
        });

        if (!await this._verifyUpdateAllowed(this.state.ns, doc)) {
          // _verifyUpdateAllowed emitted update-error
          return;
        }
        // eslint-disable-next-line no-shadow
        const [ error, d ] = await findAndModifyWithFLEFallback(this.dataService, this.state.ns, (ds, ns, opts, cb) => {
          ds.findOneAndReplace(ns, query, object, opts, cb);
        });
        if (error) {
          doc.emit('update-error', error.message);
        } else {
          doc.emit('update-success', d);
          this.localAppRegistry.emit('document-updated', this.state.view);
          this.globalAppRegistry.emit('document-updated', this.state.view);
          const index = this.findDocumentIndex(doc);
          this.state.docs[index] = new HadronDocument(d);
          this.trigger(this.state);
        }
      } catch (err) {
        doc.emit('update-error', `An error occured when attempting to update the document: ${err.message}`);
      }
    },

    /**
     * Set if the default comment should be displayed.
     *
     * @param {Boolean} isCommentNeeded - Is a comment needed or not.
     */
    updateComment(isCommentNeeded) {
      const insert = { ...this.state.insert, isCommentNeeded };
      this.setState({ insert });
    },

    /**
     * Find the index of the document in the list.
     *
     * @param {Document} doc - The hadron document.
     *
     * @returns {String} Document Index from the list.
     */
    findDocumentIndex(doc) {
      return findIndex(this.state.docs, (d) => {
        return doc.getStringId() === d.getStringId();
      });
    },

    /**
     * When the next page button is clicked, need to load the next 20 documents.
     *
     * @param {Number} page - The page that is being shown.
     */
    async getPage(page) {
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
        maxTimeMS
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

      const session = this.dataService.startSession('CRUD');
      const abortController = new AbortController();
      const signal = abortController.signal;

      abortController.signal.addEventListener('abort', this.onAbort, { once: true });

      const opts = {
        signal,
        session,
        skip,
        limit: nextPageCount,
        sort,
        projection,
        collation,
        maxTimeMS,
        promoteValues: false,
        bsonRegExp: true
      };

      this.setState({
        status: DOCUMENTS_STATUS_FETCHING,
        abortController,
        sessions: [session],
        error: null
      });

      const cancelDebounceLoad = this.debounceLoading();

      let error;
      let documents;
      try {
        documents = await findDocuments(this.dataService, ns, filter, opts);
      } catch (err) {
        documents = [];
        error = err;
      }

      const length = error ? 0 : documents.length;
      this.setState({
        error,
        status: error ? DOCUMENTS_STATUS_ERROR : DOCUMENTS_STATUS_FETCHED_PAGINATION,
        docs: documents.map(doc => new HadronDocument(doc)),
        start: skip + 1,
        end: skip + length,
        page,
        table: this.getInitialTableState(),
        resultId: resultId(),
        abortController: null,
        sessions: null
      });
      abortController.signal.removeEventListener('abort', this.onAbort);
      this.localAppRegistry.emit('documents-paginated', view, documents);
      this.globalAppRegistry.emit('documents-paginated', view, documents);

      cancelDebounceLoad();
    },

    /**
     * Closing the insert document dialog just resets the state to the default.
     */
    closeInsertDocumentDialog() {
      this.setState({
        insert: this.getInitialInsertState()
      });
    },

    /**
     * Open the insert document dialog.
     *
     * @param {Object} doc - The document to insert.
     * @param {Boolean} clone - Whether this is a clone operation.
     */
    async openInsertDocumentDialog(doc, clone) {
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

      let csfleState = 'none';
      const dataServiceCSFLEMode = this.dataService.getCSFLEMode && this.dataService.getCSFLEMode();
      if (dataServiceCSFLEMode === 'enabled') {
        // Show a warning if this is a CSFLE-enabled connection but this collection
        // does not have a schema.
        const csfleCollectionTracker = this.dataService.getCSFLECollectionTracker();
        if (!await csfleCollectionTracker.hasKnownSchemaForCollection(this.state.ns)) {
          csfleState = 'no-known-schema';
        } else if (!await csfleCollectionTracker.isUpdateAllowed(this.state.ns, doc)) {
          csfleState = 'incomplete-schema-for-cloned-doc';
        } else {
          csfleState = 'has-known-schema';
        }
      } else if (dataServiceCSFLEMode === 'disabled') {
        csfleState = 'csfle-disabled';
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
          isCommentNeeded: true
        }
      });
    },

    /**
     * Open an import file dialog from compass-import-export-plugin.
     * Emits a global app registry event the plugin listens to.
     */
    openImportFileDialog() {
      this.globalAppRegistry.emit('open-import', { namespace: this.state.ns });
    },

    /**
     * Open an export file dialog from compass-import-export-plugin.
     * Emits a global app registry event the plugin listens to.
     */
    openExportFileDialog() {
      // Only three query fields that export modal will handle
      const { filter, limit, skip } = this.state.query;
      this.globalAppRegistry.emit('open-export', {
        namespace: this.state.ns,
        query: { filter, limit, skip },
        // Pass the doc count to the export modal so we can avoid re-counting.
        count: this.state.count
      });
    },

    /**
     * Switch between list and JSON views when inserting a document through Insert Document modal.
     *
     * Also modifies doc and jsonDoc states to keep accurate data for each view.
     * @param {String} view - view we are switching to.
     */
    toggleInsertDocument(view) {
      if (view === 'JSON') {
        const jsonDoc = this.state.insert.doc.toEJSON();

        this.setState({
          insert: {
            doc: this.state.insert.doc,
            jsonView: true,
            jsonDoc: jsonDoc,
            message: '',
            csfleState: this.state.insert.csfleState,
            mode: MODIFYING,
            isOpen: true,
            isCommentNeeded: this.state.insert.isCommentNeeded
          }
        });
      } else {
        let hadronDoc;

        if (this.state.insert.jsonDoc === '') {
          hadronDoc = this.state.insert.doc;
        } else {
          hadronDoc = HadronDocument.FromEJSON(this.state.insert.jsonDoc);
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
            isCommentNeeded: this.state.insert.isCommentNeeded
          }
        });
      }
    },

    /**
     * Toggle just the jsonView insert state.
     *
     * @param {String} view - view we are switching to.
     */
    toggleInsertDocumentView(view) {
      const jsonView = view === 'JSON';
      this.setState({
        insert: {
          doc: {},
          jsonDoc: this.state.insert.jsonDoc,
          jsonView: jsonView,
          message: '',
          csfleState: this.state.insert.csfleState,
          mode: MODIFYING,
          isOpen: true,
          isCommentNeeded: this.state.insert.isCommentNeeded
        }
      });
    },

    /**
     * As we are editing a JSON document in Insert Document Dialog, update the
     * state with the inputed json data.
     *
     * @param {String} value - JSON string we are updating.
     */
    updateJsonDoc(value) {
      this.setState({
        insert: {
          doc: {},
          jsonDoc: value,
          jsonView: true,
          message: '',
          csfleState: this.state.insert.csfleState,
          mode: MODIFYING,
          isOpen: true,
          isCommentNeeded: this.state.insert.isCommentNeeded
        }
      });
    },

    /**
     * Insert a single document.
     */
    insertMany() {
      const docs =
        HadronDocument.FromEJSONArray(this.state.insert.jsonDoc)
          .map(doc => doc.generateObject());
      track('Document Inserted', {
        mode: this.state.insert.jsonView ? 'json' : 'field-by-field',
        multiple: docs.length > 1
      });

      this.dataService.insertMany(this.state.ns, docs, {}, (error) => {
        if (error) {
          return this.setState({
            insert: {
              doc: {},
              jsonDoc: this.state.insert.jsonDoc,
              jsonView: true,
              message: error.message,
              csfleState: this.state.insert.csfleState,
              mode: ERROR,
              isOpen: true,
              isCommentNeeded: this.state.insert.isCommentNeeded
            }
          });
        }
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
        // Since we are inserting a bunch of documents and we need to rerun all
        // the queries and counts for them, let's just refresh the whole set of
        // documents.
        this.refreshDocuments();
      });
    },

    /**
     * Insert the document given the document in current state.
     * Parse document from Json Insert View Modal or generate object from hadron document
     * view to insert.
     */
    insertDocument() {
      track('Document Inserted', {
        mode: this.state.insert.jsonView ? 'json' : 'field-by-field',
        multiple: false
      });

      let doc;

      if (this.state.insert.jsonView) {
        doc = HadronDocument.FromEJSON(this.state.insert.jsonDoc).generateObject();
      } else {
        doc = this.state.insert.doc.generateObject();
      }

      this.dataService.insertOne(this.state.ns, doc, {}, (error) => {
        if (error) {
          return this.setState({
            insert: {
              doc: this.state.insert.doc,
              jsonDoc: this.state.insert.jsonDoc,
              jsonView: this.state.insert.jsonView,
              message: error.message,
              csfleState: this.state.insert.csfleState,
              mode: ERROR,
              isOpen: true,
              isCommentNeeded: this.state.insert.isCommentNeeded
            }
          });
        }

        // check if the newly inserted document matches the current filter, by
        // running the same filter but targeted only to the doc's _id.
        const filter = Object.assign({}, this.state.query.filter, { _id: doc._id });
        this.dataService.count(this.state.ns, filter, {}, (err, count) => {
          if (err) {
            return this.setState({
              insert: this.getInitialInsertState()
            });
          }
          // track mode for analytics events
          const payload = {
            ns: this.state.ns,
            view: this.state.view,
            mode: this.state.insert.jsonView ? 'json' : 'default',
            multiple: false,
            docs: [doc],
          };
          this.localAppRegistry.emit('document-inserted', payload);
          this.globalAppRegistry.emit('document-inserted', payload);

          // count is greater than 0, if 1 then the new doc matches the filter
          if (count > 0) {
            return this.setState({
              docs: this.state.docs.concat([ new HadronDocument(doc) ]),
              count: this.state.count + 1,
              end: this.state.end + 1,
              insert: this.getInitialInsertState()
            });
          }
          this.setState({
            count: this.state.count + 1,
            insert: this.getInitialInsertState()
          });
        });
      });
    },

    /**
     * The user has drilled down into a new element.
     *
     * @param {HadronDocument} doc - The parent document.
     * @param {Element} element - The element being drilled into.
     * @param {Object} editParams - If we need to open a cell for editing, the coordinates.
     */
    drillDown(doc, element, editParams) {
      this.setState({
        table: {
          path: this.state.table.path.concat([ element.currentKey ]),
          types: this.state.table.types.concat([ element.currentType ]),
          doc: doc,
          editParams: editParams
        }
      });
    },

    /**
     * The path of the table view has changed.
     *
     * @param {Array} path - A list of fieldnames and indexes.
     * @param {Array} types - A list of the types of each path segment.
     */
    pathChanged(path, types) {
      this.setState({
        table: {
          doc: this.state.table.doc,
          editParams: this.state.table.editParams,
          path: path,
          types: types
        }
      });
    },

    /**
     * The view has changed.
     *
     * @param {String} view - The new view.
     */
    viewChanged(view) {
      this.globalAppRegistry.emit('document-view-changed', view);
      this.localAppRegistry.emit('document-view-changed', view);
      this.setState({ view: view });
    },

    /**
     * Detect if it is safe to perform the count query optimisation where we
     * specify the _id_ index as the hint.
     */
    isCountHintSafe() {
      const { isTimeSeries, query = {} } = this.state;
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
    },

    /**
     * Checks if the initial query was not modified.
     *
     * @param {Object} query - The query to check.
     *
     * @returns {Boolean}
     */
    isInitialQuery(query) {
      return (isEmpty(query.filter) && isEmpty(query.project) && isEmpty(query.collation));
    },

    /**
     * This function is called when the collection filter changes.
     */
    async refreshDocuments() {
      if (this.dataService && !this.dataService.isConnected()) {
        log.warn(mongoLogId(1001000072), 'Documents', 'Trying to refresh documents but dataService is disconnected');
        return;
      }

      const { ns, status, view, query = {} } = this.state;

      if (status === DOCUMENTS_STATUS_FETCHING) {
        return;
      }

      const fetchShardingKeysOptions = {
        maxTimeMS: query.maxTimeMS,
        session: this.dataService.startSession('CRUD')
      };

      const countOptions = {
        skip: query.skip,
        maxTimeMS: query.maxTimeMS > COUNT_MAX_TIME_MS_CAP ?
          COUNT_MAX_TIME_MS_CAP :
          query.maxTimeMS,
        session: this.dataService.startSession('CRUD')
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
        maxTimeMS: query.maxTimeMS,
        promoteValues: false,
        bsonRegExp: true,
        session: this.dataService.startSession('CRUD')
      };

      // only set limit if it's > 0, read-only views cannot handle 0 limit.
      if (query.limit > 0) {
        countOptions.limit = query.limit;
        findOptions.limit = Math.min(NUM_PAGE_DOCS, query.limit);
      }

      log.info(mongoLogId(1001000073), 'Documents', 'Refreshing documents', {
        ns,
        withFilter: !isEmpty(query.filter),
        findOptions,
        countOptions
      });

      const abortController = new AbortController();
      const signal = abortController.signal;

      abortController.signal.addEventListener('abort', this.onAbort, { once: true });

      // pass the signal so that the queries can close their own cursors and
      // reject their promises
      fetchShardingKeysOptions.signal = signal;
      countOptions.signal = signal;
      findOptions.signal = signal;

      // Don't wait for the count to finish. Set the result asynchronously.
      countDocuments(this.dataService, ns, query.filter, countOptions)
        .then((count) => this.setState({ count, loadingCount: false }))
        .catch((err) => {
          // countDocuments already swallows all db errors and returns null. The
          // only known error it can throw is OPERATION_CANCELLED_MESSAGE. If
          // something new does appear we probably shouldn't swallow it.
          if (err.message !== OPERATION_CANCELLED_MESSAGE) {
            throw err;
          }
          this.setState({ loadingCount: false });
        });

      const promises = [
        fetchShardingKeys(this.dataService, ns, fetchShardingKeysOptions),
        findDocuments(this.dataService, ns, query.filter, findOptions)
      ];

      // This is so that the UI can update to show that we're fetching
      this.setState({
        status: DOCUMENTS_STATUS_FETCHING,
        abortController,
        /**
         * We have separate sessions created for the commands we are running as
         * running commands with the same session concurrently is not really
         * supported by the server. Even though it works in some environments,
         * it breaks in others, so having separate sessions is a more spec
         * compliant way of doing this
         *
         * @see https://docs.mongodb.com/manual/core/read-isolation-consistency-recency/#client-sessions-and-causal-consistency-guarantees
         * @see https://github.com/mongodb/specifications/blob/master/source/sessions/driver-sessions.rst#why-do-we-say-drivers-must-not-attempt-to-detect-unsafe-multi-threaded-or-multi-process-use-of-clientsession
         */
        sessions: [
          fetchShardingKeysOptions.session,
          countOptions.session,
          findOptions.session,
        ],
        outdated: false,
        error: null,
        count: null, // we don't know the new count yet
        loadingCount: true
      });

      // don't start showing the loading indicator and cancel button immediately
      const cancelDebounceLoad = this.debounceLoading();

      const stateChanges = {};

      try {
        const [shardKeys, docs] = await Promise.all(promises);

        Object.assign(stateChanges, {
          status: this.isInitialQuery(query) ?
            DOCUMENTS_STATUS_FETCHED_INITIAL :
            DOCUMENTS_STATUS_FETCHED_CUSTOM,
          isEditable: this.hasProjection(query) ? false : this.isListEditable(),
          error: null,
          docs: docs.map(doc => new HadronDocument(doc)),
          page: 0,
          start: docs.length > 0 ? 1 : 0,
          end: docs.length,
          table: this.getInitialTableState(),
          shardKeys,
        });

        this.localAppRegistry.emit('documents-refreshed', view, docs);
        this.globalAppRegistry.emit('documents-refreshed', view, docs);
      } catch (error) {
        log.error(mongoLogId(1001000074), 'Documents', 'Failed to refresh documents', error);
        Object.assign(stateChanges, {
          error,
          status: DOCUMENTS_STATUS_ERROR,
        });
      }

      // cancel the debouncing status if we load before the timer fires
      cancelDebounceLoad();

      Object.assign(stateChanges, {
        abortController: null,
        sessions: null,
        resultId: resultId(),
      });

      abortController.signal.removeEventListener('abort', this.onAbort);

      // Trigger all the accumulated changes once at the end
      this.setState(stateChanges);
    },

    async onAbort() {
      const { sessions } = this.state;
      if (!sessions) {
        return;
      }
      this.setState({ sessions: null });
      try {
        await this.dataService.killSessions(sessions);
      } catch (err) {
        log.warn(mongoLogId(1001000096), 'Documents', 'Attempting to kill the session failed');
      }
    },

    cancelOperation() {
      const { abortController } = this.state;
      if (!abortController) {
        return;
      }
      this.setState({ abortController: null });

      abortController.abort();
    },

    debounceLoading() {
      this.setState({ debouncingLoad: true });

      const debouncePromise = new Promise((resolve) => {
        setTimeout(resolve, 200); // 200ms should feel about instant
      });

      let cancelDebounceLoad;
      const loadPromise = new Promise((resolve) => {
        cancelDebounceLoad = resolve;
      });

      Promise.race([debouncePromise, loadPromise])
        .then(() => {
          this.setState({ debouncingLoad: false });
        });

      return cancelDebounceLoad;
    },

    hasProjection(query) {
      return !!(query.project && Object.keys(query.project).length > 0);
    },

    /**
     * Set the data service on the store.
     *
     * @param {Error} error - The error connecting.
     * @param {DataService} dataService - The data service.
     */
    setDataService(error, dataService) {
      if (!error) {
        this.dataService = dataService;
      }
    }
  });


  // Set the app registry if preset. This must happen first.
  if (options.localAppRegistry) {
    const localAppRegistry = options.localAppRegistry;

    localAppRegistry.on('query-changed', store.onQueryChanged.bind(store));
    localAppRegistry.on('refresh-data', store.refreshDocuments.bind(store));

    setLocalAppRegistry(store, options.localAppRegistry);
  }

  // Set global app registry to get status actions.
  if (options.globalAppRegistry) {
    const globalAppRegistry = options.globalAppRegistry;

    globalAppRegistry.on('instance-created', ({ instance }) => {
      store.onInstanceCreated(instance);
    });

    globalAppRegistry.on('refresh-data', () => {
      store.refreshDocuments();
    });

    globalAppRegistry.on('import-finished', ({ ns }) => {
      if (ns === store.state.ns) {
        store.refreshDocuments();
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
      options.dataProvider.dataProvider
    );

    if (!options.noRefreshOnConfigure) {
      store.refreshDocuments();
    }
  }

  const gridStore = configureGridStore(options);
  store.gridStore = gridStore;

  return store;
};

export default configureStore;

function resultId() {
  return Math.floor(Math.random() * (2 ** 53));
}


export async function findAndModifyWithFLEFallback(ds, ns, doFindAndModify) {
  const opts = { returnDocument: 'after', promoteValues: false };
  let [ error, d ] = await new Promise(resolve => {
    doFindAndModify(ds, ns, opts, (...cbArgs) => resolve(cbArgs));
  });
  const originalError = error;

  // 6371402 is "'findAndModify with encryption only supports new: false'"
  if (error && +error.code === 6371402) {
    // For encrypted documents, returnDocument: 'after' is unsupported on the server
    const fallbackOpts = { returnDocument: 'before', promoteValues: false };
    [ error, d ] = await new Promise(resolve => {
      doFindAndModify(ds, ns, fallbackOpts, (...cbArgs) => resolve(cbArgs));
    });

    if (!error) {
      let docs;
      [ error, docs ] = await new Promise(resolve => {
        ds.find(ns, { _id: d._id }, fallbackOpts, (...cbArgs) => resolve(cbArgs));
      });

      if (error || !docs || !docs.length) {
        // Race condition -- most likely, somebody else
        // deleted the document between the findAndModify command
        // and the find command. Just return the original error.
        error = originalError;
        d = undefined;
      } else {
        [d] = docs;
      }
    }
  }

  return [error, d];
}
