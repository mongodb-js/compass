const Reflux = require('reflux');
const toNS = require('mongodb-ns');
const ipc = require('hadron-ipc');
const toPairs = require('lodash.topairs');
const findIndex = require('lodash.findindex');
const StateMixin = require('reflux-state-mixin');
const HadronDocument = require('hadron-document');
const { ObjectId } = require('bson');
const Actions = require('../actions');

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
 * The main CRUD store.
 */
const CRUDStore = Reflux.createStore({
  mixins: [StateMixin.store],
  listenables: Actions,

  /**
   * Listen for IPC events after init.
   */
  init() {
    ipc.on('window:menu-open-insert-document-dialog', () => {
      this.openInsertDocumentDialog({ _id: new ObjectId(), '': '' }, false);
    });
  },

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
      end: 0,
      page: 0,
      isEditable: true,
      view: LIST,
      count: 0,
      remove: {},
      insert: this.getInitialInsertState(),
      table: this.getInitialTableState(),
      query: {
        filter: {},
        sort: [[ '_id', 1 ]],
        limit: 0,
        skip: 0,
        project: null
      }
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
      message: '',
      mode: MODIFYING,
      isOpen: false
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
   * Add the hooks into the app registry.
   *
   * @param {AppRegistry} appRegistry - The app registry.
   */
  onActivated(appRegistry) {
    appRegistry.on('collection-changed', this.onCollectionChanged.bind(this));
    appRegistry.on('query-changed', this.onQueryChanged.bind(this));
    appRegistry.on('data-service-connected', this.setDataService.bind(this));
    this.CollectionStore = appRegistry.getStore('App.CollectionStore');
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
      table: {
        path: [],
        types: [],
        doc: null,
        editParams: null
      }
    });
  },

  /**
   * Fires when the query is changed.
   *
   * @param {Object} state - The query state.
   */
  onQueryChanged(state) {
    const collection = toNS(state.ns).collection;
    if (state.ns && collection) {
      this.state.query.filter = state.filter || {};
      this.state.query.sort = toPairs(state.sort);
      this.state.query.limit = state.limit;
      this.state.query.skip = state.skip || 0;
      this.state.query.project = state.project;
      this.state.ns = state.ns;
      this.state.collection = collection;
      if (state.project) {
        this.state.isEditable = false;
      } else {
        const editable = this.isListEditable();
        this.state.isEditable = editable;
      }
      this.refreshDocuments();
    }
  },

  /**
   * Determine if the document list is editable.
   *
   * @returns {Boolean} If the list is editable.
   */
  isListEditable() {
    return !this.CollectionStore.isReadonly() && process.env.HADRON_READONLY !== 'true';
  },

  /**
   * Remove the provided document from the collection.
   *
   * @param {Document} doc - The hadron document.
   */
  removeDocument(doc) {
    const id = doc.getId();
    const stringId = doc.getStringId();
    if (id) {
      this.dataService.deleteOne(this.state.ns, { _id: id }, {}, (error) => {
        if (error) {
          this.state.remove[stringId] = {
            message: error.message,
            mode: ERROR
          };
          this.trigger(this.state);
        } else {
          delete this.state.remove[stringId];
          const index = findIndex(this.state.docs, (d) => {
            const _id = d._id;
            if (id instanceof ObjectId) {
              return id.equals(_id);
            }
            return _id === id;
          });
          this.state.docs.splice(index, 1);
          this.trigger(this.state);
        }
      });
    } else {
      this.state.remove[stringId] = {
        message: 'Cannot delete a document without an _id',
        mode: ERROR
      };
      this.trigger(this.state);
    }
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
    const options = {
      skip: skip + this.state.query.skip,
      limit: nextPageCount,
      sort: this.state.query.sort,
      fields: this.state.query.project,
      promoteValues: false
    };
    this.dataService.find(this.state.ns, this.state.query.filter, options, (error, documents) => {
      const length = error ? 0 : documents.length;
      this.setState({
        error: error,
        docs: documents.map(doc => new HadronDocument(doc)),
        start: skip + 1,
        end: skip + length,
        page: page,
        counter: this.state.counter + NUM_PAGE_DOCS,
        table: this.getInitialTableState()
      });
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
    const options = {
      skip: skip + this.state.query.skip,
      limit: nextPageCount,
      sort: this.state.query.sort,
      fields: this.state.query.project,
      promoteValues: false
    };
    this.dataService.find(this.state.ns, this.state.query.filter, options, (error, documents) => {
      const length = error ? 0 : documents.length;
      this.setState({
        error: error,
        docs: documents.map(doc => new HadronDocument(doc)),
        start: skip + 1,
        end: skip + length,
        page: page,
        counter: this.state.counter - NUM_PAGE_DOCS,
        table: this.getInitialTableState()
      });
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
    const hadronDoc = new HadronDocument(doc, true);
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
    this.setState({
      insert: {
        doc: hadronDoc,
        message: '',
        mode: MODIFYING,
        isOpen: true
      }
    });
  },

  /**
   * Insert the document.
   *
   * @param {Document} hadronDoc - The hadron document to insert.
   */
  insertDocument(hadronDoc) {
    const doc = hadronDoc.generateObject();
    this.dataService.insertOne(this.state.ns, doc, {}, (error) => {
      if (error) {
        return this.setState({
          insert: {
            doc: hadronDoc,
            message: error.message,
            mode: ERROR,
            isOpen: true
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
    this.setState({ view: view });
  },

  /**
   * This function is called when the collection filter changes.
   *
   * @param {Object} filter - The query filter.
   */
  refreshDocuments() {
    const query = this.state.query;
    const countOptions = {
      skip: query.skip
    };

    const findOptions = {
      sort: query.sort,
      fields: query.project,
      skip: query.skip,
      limit: NUM_PAGE_DOCS,
      promoteValues: false
    };

    // only set limit if it's > 0, read-only views cannot handle 0 limit.
    if (query.limit > 0) {
      countOptions.limit = query.limit;
      findOptions.limit = Math.min(NUM_PAGE_DOCS, query.limit);
    }

    this.dataService.count(this.state.ns, query.filter, countOptions, (err, count) => {
      if (!err) {
        this.dataService.find(this.state.ns, query.filter, findOptions, (error, documents) => {
          const length = documents.length;
          this.setState({
            error: error,
            docs: documents.map(doc => new HadronDocument(doc)),
            count: count,
            page: 0,
            start: length > 0 ? 1 : 0,
            end: length,
            table: this.getInitialTableState()
          });
        });
      } else {
        // If the count gets an error we need to display this to the user since
        // they have the wrong privs.
        this.setState({ error: err });
      }
    });
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

module.exports = CRUDStore;
