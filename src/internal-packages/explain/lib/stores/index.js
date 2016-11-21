const Reflux = require('reflux');
const ExplainActions = require('../actions');
const StateMixin = require('reflux-state-mixin');
const app = require('ampersand-app');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
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
    this.query = {};

    // reset on namespace change
    NamespaceStore.listen((ns) => {
      if (ns && toNS(ns).collection) {
        this.query = {};
        this._reset();
      }
    });

    this.listenToExternalStore('Indexes.IndexStore', this.indexesChanged.bind(this));

    // listen for query changes
    this.listenToExternalStore('Query.ChangedStore', this.onQueryChanged.bind(this));

    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
    this.indexes = [];
  },

  indexesChanged(indexes) {
    this.indexes = indexes;
  },

  onQueryChanged(state) {
    if (state.query) {
      this.query = state.query;
      this.fetchExplainPlan();
    }
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

  _reset() {
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

    this._reset();

    this.setState({
      explainState: 'fetching'
    });

    // const QueryStore = app.appRegistry.getStore('Query.Store');
    // const filter = QueryStore.state.query;
    const options = {};
    const ns = toNS(NamespaceStore.ns);
    if (!ns.database || !ns.collection) {
      return;
    }
    if (this.CollectionStore.isReadonly()) {
      this.setState(this.getInitialState());
    } else {
      app.dataService.explain(ns.ns, this.query, options, (err, explain) => {
        if (err) {
          return debug('error fetching explain plan:', err);
        }
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
