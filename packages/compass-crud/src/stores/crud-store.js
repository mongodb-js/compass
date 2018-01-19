const Reflux = require('reflux');
const toNS = require('mongodb-ns');
const ipc = require('hadron-ipc');
const toPairs = require('lodash.topairs');
const StateMixin = require('reflux-state-mixin');
const HadronDocument = require('hadron-document');
const { ObjectId } = require('bson');
const Actions = require('../actions');

/**
 * Number of docs per page.
 */
const NUM_PAGE_DOCS = 20;

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
      page: 1,
      isEditable: true,
      view: LIST,
      insert: {
        doc: null,
        isOpen: false,
        error: null
      },
      count: 0,
      table: {
        doc: null,
        path: [],
        types: [],
        editParams: null
      },
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
      this.state.query.skip = state.skip;
      this.state.query.project = state.project;
      this.state.ns = state.ns;
      this.state.collection = collection;
      if (state.project) {
        this.state.isEditable = false;
      } else {
        const editable = this.isListEditable();
        this.state.isEditable = editable;
      }
      this.resetDocuments();
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
        docs: documents,
        start: skip + 1,
        end: skip + length,
        page: page,
        counter: this.state.counter + NUM_PAGE_DOCS
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
        docs: documents,
        start: skip + 1,
        end: skip + length,
        page: page,
        counter: this.state.counter - NUM_PAGE_DOCS
      });
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
    this.setState({ insert: { doc: hadronDoc, isOpen: true }});
  },

  /**
   * Insert the document.
   *
   * @param {Document} doc - The document to insert.
   */
  insertDocument(doc) {
    this.dataService.insertOne(this.state.ns, doc, {}, (error) => {
      if (error) {
        return this.setState({
          insert: {
            error: error,
            doc: this.state.insert.doc,
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
            insert: {
              error: error,
              doc: null,
              isOpen: false
            }
          });
        }
        // count is greater than 0, if 1 then the new doc matches the filter
        if (count > 0) {
          return this.setState({
            docs: this.state.docs.concat([ doc ]),
            count: this.state.count + 1,
            insert: {
              doc: null,
              isOpen: false,
              error: null
            }
          });
        }
        this.setState({
          count: this.state.count + 1,
          insert: {
            doc: null,
            isOpen: false,
            error: null
          }
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
  resetDocuments() {
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
          this.setState({
            error: error,
            docs: documents,
            count: count
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
