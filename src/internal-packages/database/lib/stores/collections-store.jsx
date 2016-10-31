const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');
const CollectionsActions = require('../actions/collections-actions');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const app = require('ampersand-app');
const toNS = require('mongodb-ns');
const _ = require('lodash');

const debug = require('debug')('mongodb-compass:stores:collections');

const COLL_COLUMNS = ['Collection Name', 'Num. Documents', 'Avg. Document Size', 'Num. Indexes'];

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
    this.InstanceStore = app.appRegistry.getStore('App.InstanceStore');
    NamespaceStore.listen(this.onNamespaceChanged.bind(this));
    // this.listenToExternalStore('App.InstanceStore', );
    this.indexes = [];
  },

  getInitialState() {
    return {
      columns: COLL_COLUMNS,
      collections: [],
      sortOrder: 'asc',
      sortColumn: 'Collection Name'
    };
  },

  _sort(collections, column, order) {
    return _.sortByOrder(collections,
      column || this.state.sortColumn, order || this.state.sortOrder);
  },

  onNamespaceChanged() {
    const ns = toNS(NamespaceStore.ns);
    if (!ns.database) {
      this.setState({
        collections: []
      });
      return;
    }

    const instance = this.InstanceStore.state.instance;
    const database = instance.databases.get(ns.database);

    const unsorted = database.collections.map((db) => {
      return _.zipObject(COLL_COLUMNS, [
        toNS(db._id).collection
      ]);
    });

    this.setState({
      collections: this._sort(unsorted)
    });
  },

  sortCollections(column, order) {
    this.setState({
      collections: this._sort(this.state.collections, column, order),
      sortColumn: column,
      sortOrder: order
    });
  },

  // deleteCollection(dbName) {
  //   // TODO remove collection on server
  // },
  //
  // createCollection(collName) {
  //   // TODO create collection
  // }

  /**
   * log changes to the store as debug messages.
   * @param  {Object} prevState   previous state.
   */
  storeDidUpdate(prevState) {
    debug('collections store changed from', prevState, 'to', this.state);
  }

});

module.exports = CollectionsStore;
