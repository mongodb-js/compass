const Reflux = require('reflux');
const ExplainActions = require('../actions');
const StateMixin = require('reflux-state-mixin');
const app = require('ampersand-app');
const packageActivationCompleted = require('hadron-package-manager/lib/action').packageActivationCompleted;
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
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
    this.listenTo(packageActivationCompleted, this.packageActivationCompleted.bind(this));
    this.indexes = [];
  },

  packageActivationCompleted() {
    const indexStore = app.appRegistry.getStore('Store::Indexes::IndexStore');
    this.listenTo(indexStore, this.indexesChanged.bind(this));
  },

  indexesChanged(indexes) {
    this.indexes = indexes;
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

    const QueryStore = app.appRegistry.getStore('QueryStore');
    const filter = QueryStore.state.query;
    const options = {};

    app.dataService.explain(NamespaceStore.ns, filter, options, (err, explain) => {
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
