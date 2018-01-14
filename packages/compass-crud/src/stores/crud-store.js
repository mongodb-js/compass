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
      error: null,
      documents: [],
      count: 0,
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
    appRegistry.on('query-changed', this.onQueryChanged.bind(this));
    appRegistry.on('data-service-connected', this.setDataService.bind(this));
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
  },

  /**
   * Fires when the query is changed.
   *
   * @param {Object} state - The query state.
   */
  onQueryChanged(state) {
    if (state.ns && toNS(state.ns).collection) {
      this.state.query.filter = state.filter || {};
      this.state.query.sort = toPairs(state.sort);
      this.state.query.limit = state.limit;
      this.state.query.skip = state.skip;
      this.state.query.project = state.project;
      this.state.ns = state.ns;
      this.resetDocuments();
    }
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
            documents: documents,
            count: count
          });
        });
      } else {
        // If the count gets an error we need to display this to the user since
        // they have the wrong privs.
        this.setState({ error: err });
      }
    });
  }
});

module.exports = CRUDStore;
