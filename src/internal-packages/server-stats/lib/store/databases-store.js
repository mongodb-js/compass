const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');
const DatabasesActions = require('../action/databases-actions');

const _ = require('lodash');

const debug = require('debug')('mongodb-compass:stores:databases');

const DB_COLUMNS = ['Database Name', 'Storage Size', 'Collections', 'Indexes'];

/**
 * Databases store, used to present a table of databases with some basic
 * stats, and allow DDL (create / delete databases).
 *
 * This store refreshes every time the App.InstanceStore changes.
 */
const DatabasesStore = Reflux.createStore({
  /**
   * adds a state to the store, similar to React.Component's state
   * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
   */
  mixins: [StateMixin.store],

  /**
  * listen to all database related actions
  */
  listenables: DatabasesActions,

  /**
   * Initialize everything that is not part of the store's state.
   */
  init() {
    this.listenToExternalStore('App.InstanceStore', this.onInstanceRefreshed.bind(this));
    this.indexes = [];
  },

  getInitialState() {
    return {
      columns: DB_COLUMNS,
      databases: [],
      sortOrder: 'asc',
      sortColumn: 'Name'
    };
  },

  _sort(databases, column, order) {
    return _.sortByOrder(databases,
      column || this.state.sortColumn, order || this.state.sortOrder);
  },

  onInstanceRefreshed(state) {
    if (!_.has(state, 'instance') || _.isEmpty(state.instance)) {
      this.setState({
        databases: []
      });
    }

    const unsorted = state.instance.databases.map((db) => {
      return _.zipObject(DB_COLUMNS, [
        db._id, db.storage_size, db.collections.length, db.index_count
      ]);
    });

    this.setState({
      databases: this._sort(unsorted)
    });
  },

  sortDatabases(column, order) {
    this.setState({
      databases: this._sort(this.state.databases, column, order),
      sortColumn: column,
      sortOrder: order
    });
  },

  // deleteDatabase(dbName) {
  //   // TODO remove database on server
  // },
  //
  // createDatabaseWithCollection(dbName, collection) {
  //   // TODO create database with empty collection
  // }

  /**
   * log changes to the store as debug messages.
   * @param  {Object} prevState   previous state.
   */
  storeDidUpdate(prevState) {
    debug('databases store changed from', prevState, 'to', this.state);
  }

});

module.exports = DatabasesStore;
