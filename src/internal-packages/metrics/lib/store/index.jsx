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
    // mark the current status as "fetching"
    this.setState({
      status: 'fetching'
    });

    // run a find with limit 20 on the current collection
    const filter = {};
    const options = {
      limit: 30
    };
    app.dataService.find(NamespaceStore.ns, filter, options, (error, documents) => {
      if (error) {
        // oops, there was an error, set status to "error"
        this.setState({
          status: 'error'
        });
        return;
      }
      const arr = [];
      documents.forEach(function(element) {
        arr.push({
          date: element._id,
          metrics: element.metrics.versionLaunches
        });
      });
      // all well, set status to "done" and set the documents
      this.setState({
        status: 'done',
        documents: arr
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
