const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');
const CollectionsActions = require('../actions/collections-actions');
const toNS = require('mongodb-ns');
const app = require('hadron-app');
const { LOADING_STATE } = require('../constants');
const _ = require('lodash');

const debug = require('debug')('mongodb-compass:stores:collections');

const COLL_COLUMNS = [
  'Collection Name',
  'Documents',
  'Avg. Document Size',
  'Total Document Size',
  'Num. Indexes',
  'Total Index Size'
];

/**
 * Databases store, used to present a table of databases with some basic
 * stats, and allow DDL (create / delete databases).
 *
 * This store refreshes every time the App.InstanceStore changes.
 */
const CollectionsStore = Reflux.createStore({
  /**
   * adds a state to the store, similar to React.Component's state
   * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
   */
  mixins: [StateMixin.store],

  /**
  * listen to all database related actions
  */
  listenables: CollectionsActions,

  onActivated(appRegistry) {
    // set up listeners on external stores
    appRegistry.getStore('Home.HomeStore').listen(this.onHomeChange.bind(this));
  },

  getInitialState() {
    return {
      columns: COLL_COLUMNS,
      collections: [],
      database: '',
      sortOrder: 'asc',
      sortColumn: 'Collection Name',
      fetchState: 'initial',
      errorMessage: ''
    };
  },

  _sort(collections, column, order) {
    return _.sortByOrder(collections,
      column || this.state.sortColumn, order || this.state.sortOrder);
  },

  _setDatabaseCollections(databases, namespace) {
    app.dataService.database(namespace, {}, (err, res) => {
      if (err) {
        this.setState({
          collections: [],
          fetchState: 'error',
          errorMessage: err
        });
        return;
      }
      const unsorted = _(res.collections)
      .filter((coll) => {
        // skip system collections
        const ns = toNS(coll.ns);
        return !ns.system;
      })
      .map((coll) => {
        // re-format for table view
        return _.zipObject(COLL_COLUMNS, [
          coll.name, // Collection Name
          coll.document_count, // Num. Documents
          coll.size / coll.document_count, // Avg. Document Size
          coll.size, // Total Document Size
          coll.index_count,  // Num Indexes
          coll.index_size // Total Index Size
        ]);
      })
      .value();
      this.setState({
        collections: this._sort(unsorted),
        database: namespace
      });
    });
  },

  onHomeChange(state) {
    const namespace = state.namespace;
    if (!namespace || namespace.includes('.') || state.instance.databases === LOADING_STATE) {
      return;
    }

    this._setDatabaseCollections(state.instance.databases, namespace);
  },

  sortCollections(column, order) {
    this.setState({
      collections: this._sort(this.state.collections, column, order),
      sortColumn: column,
      sortOrder: order
    });
  },

  /**
   * log changes to the store as debug messages.
   * @param  {Object} prevState   previous state.
   */
  storeDidUpdate(prevState) {
    debug('collections store changed from', prevState, 'to', this.state);
  }
});

module.exports = CollectionsStore;
