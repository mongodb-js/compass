const Reflux = require('reflux');
const MetricsAction = require('../action');
const StateMixin = require('reflux-state-mixin');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;

const app = require('ampersand-app');

const debug = require('debug')('mongodb-compass:stores:metrics');

/**
 * Metrics store.
 */

const MetricsStore = Reflux.createStore({
  /**
   * adds a state to the store, similar to React.Component's state
   * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
   */
  mixins: [StateMixin.store],

  /**
   * listen to all actions defined in ../actions/index.jsx
   */
  listenables: MetricsAction,

  /**
   * Initialize everything that is not part of the store's state.
   */
  init() {},

  /**
   * Initialize the Metrics store state.
   *
   * @return {Object} initial store state.
   */
  getInitialState() {
    return {
      status: 'initial',
      documents: []
    };
  },

  /**
   * fetch the metrics documents from the collection and update the store status.
   */
  fetchMetrics() {
    this.setState({
      status: 'fetching'
    });

    const filter = {};
    const options = {
      limit: 20
    };
    app.dataService.find(NamespaceStore.ns, filter, options, (error, documents) => {
      if (error) {
        this.setState({
          status: 'error'
        });
        return;
      }
      this.setState({
        status: 'done',
        documents: documents
      });
    });
  },

  /**
   * log changes to the store as debug messages.
   * @param  {Object} prevState   previous state.
   */
  storeDidUpdate(prevState) {
    debug('Metrics store changed from %j to %j', prevState, this.state);
  }
});

module.exports = MetricsStore;
