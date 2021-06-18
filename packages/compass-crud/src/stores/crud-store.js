import Reflux from 'reflux';
import toNS from 'mongodb-ns';
import EJSON from 'mongodb-extended-json';
import { findIndex, isEmpty } from 'lodash';
import StateMixin from 'reflux-state-mixin';
import HadronDocument from 'hadron-document';
import util from 'util';
import createDebug from 'debug';
const debug = createDebug('mongodb-compass:crud:crud-store');

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
        error: null,
        docs: [],
        counter: 0,
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
        status: 'fetching',
        outdated: false,
        shardKeys: null
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
        this.state.status === 'fetchedWithInitialQuery' ||
        this.state.status === 'fetchedWithCustomQuery'
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
    getNextPage(page) {
      const skip = page * NUM_PAGE_DOCS;

      const documentsLoaded = this.state.counter + NUM_PAGE_DOCS;
      const limit = this.state.query.limit;
      let nextPageCount = NUM_PAGE_DOCS;
      if (limit > 0 && documentsLoaded + nextPageCount > limit) {
        nextPageCount = limit - documentsLoaded;
        if (nextPageCount === 0) {
          return;
        }
      }
      const opts = {
        skip: skip + this.state.query.skip,
        limit: nextPageCount,
        sort: this.state.query.sort,
        projection: this.state.query.project,
        collation: this.state.query.collation,
        maxTimeMS: this.state.query.maxTimeMS,
        promoteValues: false
      };

      this.globalAppRegistry.emit('compass:status:show-progress-bar');

      this.dataService.find(this.state.ns, this.state.query.filter, opts, (error, documents) => {
        const length = error ? 0 : documents.length;
        this.globalAppRegistry.emit('compass:status:done');
        this.setState({
          error: error,
          docs: documents.map(doc => new HadronDocument(doc)),
          start: skip + 1,
          end: skip + ((length === 0) ? skip : length),
          page: page,
          counter: this.state.counter + NUM_PAGE_DOCS,
          table: this.getInitialTableState()
        });
        this.localAppRegistry.emit('documents-paginated', this.state.view, documents);
        this.globalAppRegistry.emit('documents-paginated', this.state.view, documents);
      });
    },

    /**
     * Get the previous page of documents.
     *
     * @param {Number} page - The page that is being shown.
     */
    getPrevPage(page) {
      const skip = page * NUM_PAGE_DOCS;
      const nextPageCount = NUM_PAGE_DOCS;
      const opts = {
        skip: skip + this.state.query.skip,
        limit: nextPageCount,
        sort: this.state.query.sort,
        projection: this.state.query.project,
        collation: this.state.query.collation,
        maxTimeMS: this.state.query.maxTimeMS,
        promoteValues: false
      };

      this.globalAppRegistry.emit('compass:status:show-progress-bar');

      this.dataService.find(this.state.ns, this.state.query.filter, opts, (error, documents) => {
        const length = error ? 0 : documents.length;
        this.globalAppRegistry.emit('compass:status:done');
        this.setState({
          error: error,
          docs: documents.map(doc => new HadronDocument(doc)),
          start: skip + 1,
          end: skip + length,
          page: page,
          counter: this.state.counter - NUM_PAGE_DOCS,
          table: this.getInitialTableState()
        });
        this.localAppRegistry.emit('documents-paginated', this.state.view, documents);
        this.globalAppRegistry.emit('documents-paginated', this.state.view, documents);
      });
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
     * Open an import file dialog from compass-import-export-plugin.
     * Emits a global app registry event the plugin listens to.
     */
    openExportFileDialog() {
      this.localAppRegistry.emit('open-export');
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
     *
     * @param {Object} filter - The query filter.
     */
    async refreshDocuments() {
      if (this.dataService && !this.dataService.isConnected()) {
        debug(
          'warning: trying to refresh documents but dataService is disconnected',
          this.dataService
        );
        return;
      }

      if (this.isRefreshingDocuments) {
        return;
      }

      this.isRefreshingDocuments = true;

      try {
        this.setState({
          status: 'fetching',
          outdated: false
        });

        const query = this.state.query || {};

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

        const fetchShardingKeysOptions = {
          maxTimeMS: query.maxTimeMS
        };

        // only set limit if it's > 0, read-only views cannot handle 0 limit.
        if (query.limit > 0) {
          countOptions.limit = query.limit;
          findOptions.limit = Math.min(NUM_PAGE_DOCS, query.limit);
        }

        debug('refreshing documents', {
          ns: this.state.ns,
          filter: query.filter,
          findOptions,
          countOptions
        });

        this.globalAppRegistry.emit('compass:status:show-progress-bar');

        const [
          shardKeys,
          count,
          docs
        ] = await Promise.all([
          fetchShardingKeys(this.dataService, this.state.ns, fetchShardingKeysOptions),
          countDocuments(this.dataService, this.state.ns, query.filter, countOptions),
          fetchDocuments(this.dataService, this.state.ns, query.filter, findOptions)
        ]);

        this.setState({
          status: this.isInitialQuery(query) ?
            'fetchedWithInitialQuery' :
            'fetchedWithCustomQuery',
          isEditable: this.hasProjection(query) ? false : this.isListEditable(),
          error: null,
          docs: docs.map(doc => new HadronDocument(doc)),
          count,
          page: 0,
          start: docs.length > 0 ? 1 : 0,
          end: docs.length,
          table: this.getInitialTableState(),
          shardKeys
        });

        this.localAppRegistry.emit('documents-refreshed', this.state.view, docs);
        this.globalAppRegistry.emit('documents-refreshed', this.state.view, docs);
      } catch (error) {
        debug('Failed to fetch data for refresh documents', error);
        this.setState({ error });
      } finally {
        this.globalAppRegistry.emit('compass:status:done');
        this.isRefreshingDocuments = false;
      }
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

  if (options.isReadonly !== null || options.isReadonly !== undefined) {
    setIsReadonly(store, options.isReadonly);
  }

  if (options.namespace) {
    setNamespace(store, options.namespace);
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


async function fetchShardingKeys(dataService, ns, fetchShardingKeysOptions) {
  const find = util.promisify(dataService.find.bind(dataService));

  const configDocs = await find(
    'config.collections',
    { _id: ns },
    { ...fetchShardingKeysOptions, projection: { key: 1, _id: 0 } }
  ).catch((err) => {
    debug('warning: unable to fetch sharding keys', err);
    return [];
  });

  if (configDocs && configDocs.length) {
    return configDocs[0].key;
  }

  return {};
}

async function countDocuments(dataService, ns, filter, countOptions) {
  return countWithHint(dataService, ns, filter, countOptions)
    .catch((err) => {
      debug('warning: unable to count documents', err);
      return null;
    });
}

async function countWithHint(dataService, ns, filter, countOptions = {}) {
  const dataServiceCount = util.promisify(dataService.count.bind(dataService));

  if (filter && Object.keys(filter).length > 0) {
    return await dataServiceCount(ns, filter, countOptions);
  }

  try { // suggest to use the _id_ index if available to speed up full count
    return await dataServiceCount(ns, filter, { hint: '_id_', ...countOptions });
  } catch (err) {
    return await dataServiceCount(ns, filter, countOptions);
  }
}

async function fetchDocuments(dataService, ns, filter, findOptions) {
  const find = util.promisify(dataService.find.bind(dataService));
  return find(ns, filter, findOptions);
}

