import Reflux from 'reflux';
import toNS from 'mongodb-ns';
import EJSON from 'mongodb-extended-json';
import { findIndex, isEmpty } from 'lodash';
import StateMixin from 'reflux-state-mixin';
import HadronDocument from 'hadron-document';
import createLogger from '@mongodb-js/compass-logging';
const { log, mongoLogId, debug } = createLogger('COMPASS-CRUD-UI');

import {
  DOCUMENTS_STATUS_INITIAL,
  DOCUMENTS_STATUS_FETCHING,
  DOCUMENTS_STATUS_ERROR,
  DOCUMENTS_STATUS_FETCHED_INITIAL,
  DOCUMENTS_STATUS_FETCHED_CUSTOM,
  DOCUMENTS_STATUS_FETCHED_PAGINATION
} from '../constants/documents-statuses';

import configureGridStore from './grid-store';

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
 * The error message to use whenever the user cancels the queries that are in
 * progress.
 */
const OPERATION_CANCELLED_MESSAGE = 'The operation was cancelled.';

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
        session: null,
        error: null,
        docs: [],
        start: 0,
        version: '3.4.0',
        end: 0,
        page: 0,
        isEditable: true,
        view: LIST,
        count: 0,
        updateSuccess: null,
        updateError: null,
        insert: this.getInitialInsertState(),
        table: this.getInitialTableState(),
        query: this.getInitialQueryState(),
        isDataLake: false,
        isReadonly: false,
        isTimeSeries: false,
        status: DOCUMENTS_STATUS_INITIAL,
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
        collation: null
      };
    },

    /**
     * Handle the instance changing.
     *
     * @param {Object} state - The instance store state.
     */
    onInstanceRefreshed(state) {
      if (!state) {
        return;
      }
      const res = { version: state.instance.build.version };
      if (state.instance.dataLake && state.instance.dataLake.isDataLake) {
        res.isDataLake = true;
        res.isEditable = false;
      }
      this.setState(res);
    },

    /**
     * Set if the collection is readonly.
     *
     * @param {Boolean} isReadonly - If the collection is readonly.
     */
    onReadonlyChanged(isReadonly) {
      this.setState({ isReadonly: isReadonly });
    },

    /**
     * Set if the collection is a time-series collection.
     *
     * @param {Boolean} isTimeSeries - If the collection is time-series.
     */
    onTimeSeriesChanged(isTimeSeries) {
      this.setState({ isTimeSeries: isTimeSeries });
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
      const documentJSON = EJSON.stringify(doc.generateObject());
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
      const id = doc.getId();
      if (id !== undefined) {
        this.dataService.deleteOne(this.state.ns, { _id: id }, {}, (error) => {
          if (error) {
            // emit on the document(list view) and success state(json view)
            doc.emit('remove-error', error.message);
            this.state.updateError = error.message;
            this.trigger(this.state);
          } else {
            // emit on the document(list view) and success state(json view)
            doc.emit('remove-success');
            this.state.updateSuccess = true;

            this.localAppRegistry.emit('document-deleted', this.state.view);
            this.globalAppRegistry.emit('document-deleted', this.state.view);
            const index = this.findDocumentIndex(doc);
            this.state.docs.splice(index, 1);
            this.setState({
              count: this.state.count - 1,
              end: this.state.end - 1
            });
          }
        });
      } else {
        doc.emit('remove-error', DELETE_ERROR);
        this.state.updateError = DELETE_ERROR;
        this.trigger(this.state);
      }
    },

    /**
     * Update the provided document unless the elements being changed were
     * changed in the background. If the elements being changed were changed
     * in the background, block the update.
     *
     * @param {Document} doc - The hadron document.
     */
    updateDocument(doc) {
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

        const opts = { returnDocument: 'after', promoteValues: false };

        this.dataService.findOneAndUpdate(
          this.state.ns,
          query,
          updateDoc,
          opts,
          (error, d) => {
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
          }
        );
      } catch (err) {
        doc.emit('update-error', `An error occured when attempting to update the document: ${err.message}`);
      }
    },

    /**
     * Replace the document in the database with the provided document.
     *
     * @param {Document} doc - The hadron document.
     */
    replaceDocument(doc) {
      const object = doc.generateObject();
      const opts = { returnDocument: 'after', promoteValues: false };
      const query = doc.getOriginalKeysAndValuesForSpecifiedKeys({
        _id: 1,
        ...(this.state.shardKeys || {})
      });
      this.dataService.findOneAndReplace(this.state.ns, query, object, opts, (error, d) => {
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
      });
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
     * Update the provided document given a document object.
     *
     * @param {Object} doc - EJSON document object.
     * @param {Document} originalDoc - origin Hadron document getting modified.
     */
    replaceExtJsonDocument(doc, originalDoc) {
      const opts = { returnDocument: 'after', promoteValues: false };
      const query = originalDoc.getOriginalKeysAndValuesForSpecifiedKeys({
        _id: 1,
        ...(this.state.shardKeys || {})
      });
      this.dataService.findOneAndReplace(this.state.ns, query, doc, opts, (error, d) => {
        if (error) {
          this.state.updateError = error.message;
          this.trigger(this.state);
        } else {
          this.state.updateSuccess = true;

          this.localAppRegistry.emit('document-updated', this.state.view);
          this.globalAppRegistry.emit('document-updated', this.state.view);

          const index = this.findDocumentIndex(originalDoc);
          this.state.docs[index] = new HadronDocument(d);
          this.trigger(this.state);
        }
      });
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
     * Clear update statuses, if updateSuccess or updateError were set by
     * replaceExtJsonDocument.
     */
    clearUpdateStatus() {
      if (this.state.updateSuccess) this.setState({ updateSuccess: null });
      if (this.state.updateError) this.setState({ updateError: null });
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

      const session = this.dataService.startSession();
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
        promoteValues: false
      };

      this.setState({
        status: DOCUMENTS_STATUS_FETCHING,
        abortController,
        session,
        error: null
      });

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
        session: null
      });
      abortController.signal.removeEventListener('abort', this.onAbort);
      this.localAppRegistry.emit('documents-paginated', view, documents);
      this.globalAppRegistry.emit('documents-paginated', view, documents);
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
    openInsertDocumentDialog(doc, clone) {
      const hadronDoc = new HadronDocument(doc, false);

      if (clone) {
        // We need to remove the _id or we will get an duplicate key error on
        // insert, and we currently do not allow editing of the _id field.
        for (const element of hadronDoc.elements) {
          if (element.currentKey === '_id') {
            hadronDoc.elements.remove(element);
            break;
          }
        }
      }

      const jsonDoc = EJSON.stringify(hadronDoc.generateObject());

      this.setState({
        insert: {
          doc: hadronDoc,
          jsonDoc: jsonDoc,
          jsonView: true,
          message: '',
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
      this.localAppRegistry.emit('open-import');
    },

    /**
     * Open an export file dialog from compass-import-export-plugin.
     * Emits a global app registry event the plugin listens to.
     */
    openExportFileDialog() {
      // Pass the doc count to the export modal so we can avoid re-counting.
      this.localAppRegistry.emit('open-export', this.state.count);
    },

    /**
     * Switch between list and JSON views when inserting a document through Insert Document modal.
     *
     * Also modifies doc and jsonDoc states to keep accurate data for each view.
     * @param {String} view - view we are switching to.
     */
    toggleInsertDocument(view) {
      if (view === 'JSON') {
        const jsonDoc = EJSON.stringify(this.state.insert.doc.generateObject());

        this.setState({
          insert: {
            doc: this.state.insert.doc,
            jsonView: true,
            jsonDoc: jsonDoc,
            message: '',
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
          hadronDoc = new HadronDocument(EJSON.parse(this.state.insert.jsonDoc), false);
        }

        this.setState({
          insert: {
            doc: hadronDoc,
            jsonView: false,
            jsonDoc: this.state.insert.jsonDoc,
            message: '',
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
      const docs = EJSON.parse(this.state.insert.jsonDoc);

      this.dataService.insertMany(this.state.ns, docs, {}, (error) => {
        if (error) {
          return this.setState({
            insert: {
              doc: {},
              jsonDoc: this.state.insert.jsonDoc,
              jsonView: true,
              message: error.message,
              mode: ERROR,
              isOpen: true,
              isCommentNeeded: this.state.insert.isCommentNeeded
            }
          });
        }
        // track mode for analytics events
        const mode = this.state.insert.jsonView ? 'json' : 'default';
        this.localAppRegistry.emit('document-inserted', this.state.view, mode, true);
        this.globalAppRegistry.emit('document-inserted', this.state.view, mode, true);

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
      let doc;

      if (this.state.insert.jsonView) {
        doc = EJSON.parse(this.state.insert.jsonDoc);
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
          const mode = this.state.insert.jsonView ? 'json' : 'default';
          this.localAppRegistry.emit('document-inserted', this.state.view, mode, false, doc);
          this.globalAppRegistry.emit('document-inserted', this.state.view, mode, false, doc);

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
        maxTimeMS: query.maxTimeMS
      };

      const countOptions = {
        skip: query.skip,
        maxTimeMS: query.maxTimeMS > COUNT_MAX_TIME_MS_CAP ?
          COUNT_MAX_TIME_MS_CAP :
          query.maxTimeMS
      };

      const findOptions = {
        sort: query.sort,
        projection: query.project,
        skip: query.skip,
        limit: NUM_PAGE_DOCS,
        collation: query.collation,
        maxTimeMS: query.maxTimeMS,
        promoteValues: false
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

      const session = this.dataService.startSession();
      const abortController = new AbortController();
      const signal = abortController.signal;

      abortController.signal.addEventListener('abort', this.onAbort, { once: true });

      // pass the signal so that the queries can close their own cursors and
      // reject their promises
      fetchShardingKeysOptions.signal = signal;
      countOptions.signal = signal;
      findOptions.signal = signal;

      // pass the session so that the queries are all associated with the same
      // session and then we can kill the whole session once
      fetchShardingKeysOptions.session = session;
      countOptions.session = session;
      findOptions.session = session;

      const promises = [
        fetchShardingKeys(this.dataService, ns, fetchShardingKeysOptions),
        countDocuments(this.dataService, ns, query.filter, countOptions),
        findDocuments(this.dataService, ns, query.filter, findOptions)
      ];

      // This is so that the UI can update to show that we're fetching
      this.setState({
        status: DOCUMENTS_STATUS_FETCHING,
        abortController,
        session,
        outdated: false,
        error: null
      });

      const stateChanges = {};

      try {
        const [shardKeys, count, docs] = await Promise.all(promises);

        Object.assign(stateChanges, {
          status: this.isInitialQuery(query) ?
            DOCUMENTS_STATUS_FETCHED_INITIAL :
            DOCUMENTS_STATUS_FETCHED_CUSTOM,
          isEditable: this.hasProjection(query) ? false : this.isListEditable(),
          error: null,
          docs: docs.map(doc => new HadronDocument(doc)),
          count,
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

      Object.assign(stateChanges, {
        abortController: null,
        session: null,
        resultId: resultId(),
      });

      abortController.signal.removeEventListener('abort', this.onAbort);

      // Trigger all the accumulated changes once at the end
      this.setState(stateChanges);
    },

    async onAbort() {
      const session = this.state.session;
      if (!session) {
        return;
      }
      this.setState({ session: null });

      try {
        await this.dataService.killSession(session);
      } catch (err) {
        log.warn(mongoLogId(1001000093), 'Documents', 'Attempting to kill the session failed');
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
    localAppRegistry.on('import-finished', store.refreshDocuments.bind(store));
    localAppRegistry.on('refresh-data', store.refreshDocuments.bind(store));

    setLocalAppRegistry(store, options.localAppRegistry);
  }

  // Set global app registry to get status actions.
  if (options.globalAppRegistry) {
    const globalAppRegistry = options.globalAppRegistry;

    globalAppRegistry.on('instance-refreshed', () => {
      store.onInstanceRefreshed();
    });
    globalAppRegistry.on('refresh-data', () => {
      store.refreshDocuments();
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

/*
 * Return a promise you can race (just like a timeout from timeouts/promises).
 * It will reject if abortSignal triggers before successSignal
*/
function abortablePromise(abortSignal, successSignal) {
  let reject;

  const promise = new Promise(function(resolve, _reject) {
    reject = _reject;
  });

  const abort = () => {
    // if this task aborts it will never succeed, so clean up that event listener
    // (abortSignal's event handler is already removed due to { once: true })
    successSignal.removeEventListener('abort', succeed);

    reject(new Error(OPERATION_CANCELLED_MESSAGE));
  };

  const succeed = () => {
    // if this task succeeds it will never abort, so clean up that event listener
    // (successSignal's event handler is already removed due to { once: true })
    abortSignal.removeEventListener('abort', abort);
  };

  abortSignal.addEventListener('abort', abort, { once: true });
  successSignal.addEventListener('abort', succeed, { once: true });

  return promise;
}

/*
 * We need a promise that will reject as soon as the operation is aborted since
 * closing the cursor isn't enough to immediately make the cursor method's
 * promise reject.
*/
async function raceWithAbort(promise, signal) {
  const successController = new AbortController();
  const abortPromise = abortablePromise(signal, successController.signal);
  try {
    return await Promise.race([abortPromise, promise]);
  } finally {
    if (!signal.aborted) {
      // either the operation succeeded or it failed because of some error
      // that's not an abort
      successController.abort();
    }
  }
}

/*
 * Return a cancel() function and the promise that resolves to the shard keys if
 * any.
*/
export async function fetchShardingKeys(dataService, ns, { signal, session, maxTimeMS }) {
  // best practise is to first check if the signal wasn't already aborted
  if (signal.aborted) {
    throw new Error(OPERATION_CANCELLED_MESSAGE);
  }

  const cursor = dataService.fetch(
    'config.collections',
    { _id: ns },
    { session, maxTimeMS, projection: { key: 1, _id: 0 } }
  );

  // close the cursor if the operation is aborted
  const abort = () => {
    cursor.close();
  };
  signal.addEventListener('abort', abort, { once: true });


  let configDocs;

  try {
    configDocs = await raceWithAbort(cursor.toArray(), signal);
  } catch (err) {
    // rethrow if we aborted along the way
    if (err.message === OPERATION_CANCELLED_MESSAGE) {
      throw err;
    }

    // for other errors assume that the query failed
    log.warn(mongoLogId(1001000075), 'Documents', 'Failed to fetch sharding keys', err);
    configDocs = [];
  }

  // clean up event handlers because we succeeded
  signal.removeEventListener('abort', abort);

  if (configDocs && configDocs.length) {
    return configDocs[0].key;
  }

  return {};
}

/*
 * Return a cancel() function and the promise that resolves to the count.
*/
export async function countDocuments(dataService, ns, filter, { signal, session, skip, limit, maxTimeMS }) {
  if (signal.aborted) {
    throw new Error(OPERATION_CANCELLED_MESSAGE);
  }

  let $match;
  if (filter && Object.keys(filter).length > 0) {
    // not all find filters are valid $match stages..
    $match = filter;
  } else {
    $match = {};
  }

  const stages = [{ $match }];
  if (skip) {
    stages.push({ $skip: skip });
  }
  if (limit) {
    stages.push({ $limit: limit });
  }
  stages.push({ $count: 'count' });

  const cursor = dataService.aggregate(ns, stages, { session, maxTimeMS });

  const abort = () => {
    cursor.close();
  };
  signal.addEventListener('abort', abort, { once: true });

  let result;
  try {
    const array = await raceWithAbort(cursor.toArray(), signal);
    // the collection could be empty
    result = array.length ? array[0].count : 0;
  } catch (err) {
    // rethrow if we aborted along the way
    if (err.message === OPERATION_CANCELLED_MESSAGE) {
      throw err;
    }

    // for all other errors we assume the query failed
    debug('warning: unable to count documents', err);
    // The count queries can frequently time out on large collections.
    // The UI will just have to deal with null.
    result = null;
  }

  signal.removeEventListener('abort', abort);

  return result;
}

/*
 * Return a cancel() function and the promise that resolves to the documents.
*/
export async function findDocuments(dataService, ns, filter, { signal, ...options }) {
  if (signal.aborted) {
    throw new Error(OPERATION_CANCELLED_MESSAGE);
  }

  const cursor = dataService.fetch(ns, filter, options);

  const abort = () => {
    cursor.close();
  };
  signal.addEventListener('abort', abort, { once: true });

  let result;
  try {
    result = await raceWithAbort(cursor.toArray(), signal);
  } finally {
    signal.removeEventListener('abort', abort);
  }

  return result;
}

function resultId() {
  return Math.floor(Math.random() * (2 ** 53));
}
