const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');
const CollectionsActions = require('../actions/collections-actions');
const app = require('ampersand-app');
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

  /**
   * Initialize everything that is not part of the store's state.
   */
  init() {
    this.listenToExternalStore('Sidebar.Store', this.onSidebarChange.bind(this));
    this.indexes = [];
  },

  getInitialState() {
    return {
      columns: COLL_COLUMNS,
      collections: [],
      database: '',
      renderedCollections: [],
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

  onSidebarChange(state) {
    // continue only when a database is the activeNamespace
    if (!state.activeNamespace || state.activeNamespace.includes('.')) {
      return;
    }

    // retrieve the collections from sidebar object
    const database = _.first(_.filter(state.databases, '_id', state.activeNamespace));

    app.dataService.database(state.activeNamespace, {}, (err, res) => {
      if (err) {
        this.setState({
          fetchState: 'error',
          errorMessage: err
        });
        return;
      }
      const unsorted = _.map(res.collections, (coll) => {
        return _.zipObject(COLL_COLUMNS, [
          coll.name, // Collection Name
          coll.document_count, // Num. Documents
          coll.size / coll.document_count, // Avg. Document Size
          coll.size, // Total Document Size
          coll.index_count,  // Num Indexes
          coll.index_size // Total Index Size
        ]);
      });

      this.setState({
        collections: database.collections,
        renderedCollections: this._sort(unsorted),
        database: state.activeNamespace
      });
    });
  },

  sortCollections(column, order) {
    this.setState({
      renderedCollections: this._sort(this.state.renderedCollections, column, order),
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
