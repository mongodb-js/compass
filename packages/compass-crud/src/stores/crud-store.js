const Reflux = require('reflux');
const toNS = require('mongodb-ns');
const toPairs = require('lodash.topairs');
const StateMixin = require('reflux-state-mixin');
const Actions = require('../actions');

/**
 * The main CRUD store.
 */
const CRUDStore = Reflux.createStore({
  mixins: [StateMixin.store],
  listenables: Actions,

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
  },

  /**
   * Plugin lifecycle method that is called when the namespace changes in
   * Compass. Trigger with new namespace and cleared path/types.
   *
   * @param {String} ns - The new namespace.
   */
  onCollectionChanged(namespace) {
    console.log(namespace);
    const nsobj = toNS(namespace);
    this.setState({
      ns: namespace,
      collection: nsobj.collection,
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
      this.resetDocuments();
    }
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
        path: path,
        types: types
      }
    });
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
      limit: 20,
      promoteValues: false
    };

    // only set limit if it's > 0, read-only views cannot handle 0 limit.
    if (query.limit > 0) {
      countOptions.limit = query.limit;
      findOptions.limit = Math.min(20, query.limit);
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
