const Reflux = require('reflux');
const ExplainActions = require('../actions');
const StateMixin = require('reflux-state-mixin');
const toNS = require('mongodb-ns');
const ExplainPlanModel = require('mongodb-explain-plan-model');
const _ = require('lodash');

const debug = require('debug')('mongodb-compass:stores:explain');

/**
 * Compass Explain store.
 */

const CompassExplainStore = Reflux.createStore({
  /**
   * adds a state to the store, similar to React.Component's state
   * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
   */
  mixins: [StateMixin.store],

  /**
   * listen to all actions defined in ../actions/index.jsx
   */
  listenables: ExplainActions,

  /**
   * Initialize everything that is not part of the store's state.
   */
  init() {
    this._resetQuery();
    this.indexes = [];
    this.ns = '';
  },

  onActivated(appRegistry) {
    appRegistry.getStore('Indexes.IndexStore').listen(this.indexesChanged.bind(this));
    appRegistry.getStore('App.NamespaceStore').listen(this.onNamespaceChanged.bind(this));
    this.CollectionStore = appRegistry.getStore('App.CollectionStore');
    appRegistry.on('query-changed', this.onQueryChanged.bind(this));
    appRegistry.on('data-service-connected', (err, dataService) => {
      if (!err) {
        this.dataService = dataService;
      }
    });
  },

  _resetQuery() {
    this.filter = {};
    this.sort = null;
    this.project = null;
    this.skip = 0;
    this.limit = 0;
  },

  indexesChanged(indexes) {
    this.indexes = indexes;
  },

  onQueryChanged(state) {
    if (state.ns && toNS(state.ns).collection) {
      this.filter = state.filter;
      this.project = state.project;
      this.sort = state.sort;
      this.skip = state.skip;
      this.limit = state.limit;
      this.ns = state.ns;

      if (this.state.explainState === 'done') {
        this.setState({
          explainState: 'outdated'
        });
      }
    }
  },

  onNamespaceChanged() {
    this.reset();
  },

  /**
   * Initialize the Explain store state.
   *
   * @return {Object} initial store state.
   */
  getInitialState() {
    return {
      explainState: 'initial',
      viewType: 'tree',
      error: null,
      executionSuccess: false,
      executionTimeMillis: 0,
      inMemorySort: false,
      isCollectionScan: false,
      isCovered: false,
      isMultiKey: false,
      isSharded: false,
      indexType: 'UNAVAILABLE',
      index: null,
      nReturned: 0,
      namespace: '',
      numShards: 0,
      parsedQuery: {},
      rawExplainObject: {},
      totalDocsExamined: 0,
      totalKeysExamined: 0,
      usedIndex: null
    };
  },

  reset() {
    this.setState(this.getInitialState());
  },

  /**
   * switches the details view to the tree layout
   */
  switchToTreeView() {
    this.setState({
      viewType: 'tree'
    });
  },

  /**
   * switches the details view to the raw json layout
   */
  switchToJSONView() {
    this.setState({
      viewType: 'json'
    });
  },

  _getIndexType(explainPlan) {
    if (!explainPlan) {
      return 'UNAVAILABLE';
    }
    if (_.isArray(explainPlan.usedIndex)) {
      return 'MULTIPLE';
    }
    if (explainPlan.isCollectionScan) {
      return 'COLLSCAN';
    }
    if (explainPlan.isCovered) {
      return 'COVERED';
    }
    return 'INDEX';
  },

  fetchExplainPlan() {
    if (this.state.explainState === 'fetching') {
      return;
    }

    this.reset();

    this.setState({
      explainState: 'fetching'
    });

    // const QueryStore = app.appRegistry.getStore('Query.Store');
    // const filter = QueryStore.state.query;
    const options = {
      sort: this.sort,
      fields: this.project,
      skip: this.skip,
      limit: this.limit
    };

    if (this.CollectionStore.isReadonly()) {
      this.setState(this.getInitialState());
    } else {
      this.dataService.explain(this.ns, this.filter, options, (err, explain) => {
        if (err) {
          // @note: Need the UI to render the error and not continue.
          this.setState({ error: err });
        } else {
          const explainPlanModel = new ExplainPlanModel(explain);
          const newState = explainPlanModel.serialize();

          // extract index type, index object
          newState.indexType = this._getIndexType(newState);
          newState.index = _.isString(newState.usedIndex) ?
            _.find(this.indexes, (idx) => {
              return idx.name === newState.usedIndex;
            }) : null;
          newState.explainState = 'done';
          this.setState(newState);
        }
      });
    }
  },

  /**
   * log changes to the store as debug messages.
   * @param  {Object} prevState   previous state.
   */
  storeDidUpdate(prevState) {
    debug('explain store changed from', prevState, 'to', this.state);
  }
});

module.exports = CompassExplainStore;
