const Reflux = require('reflux');
const ExplainActions = require('../actions');
const StateMixin = require('reflux-state-mixin');
// const ExplainPlanModel = require('mongodb-explain-plan-model');

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
  init() {},

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

  fetchExplainPlan() {
    if (this.state.explainState === 'fetching') {
      return;
    }

    this._reset();
    // @todo use data service to fetch explain plan
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
