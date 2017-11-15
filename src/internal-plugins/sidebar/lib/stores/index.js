const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');

const SidebarActions = require('../actions');
const { LOADING_STATE } = require('../constants');

const debug = require('debug')('mongodb-compass:stores:sidebar');

const BLANK = '(?:)';

/**
* Compass Sidebar store.
*/

const SidebarStore = Reflux.createStore({
  /**
  * adds a state to the store, similar to React.Component's state
  * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
  */
  mixins: [StateMixin.store],

  /**
  * listen to all actions defined in ../actions/index.jsx
  */
  listenables: [SidebarActions],

  onActivated(appRegistry) {
    appRegistry.getStore('App.InstanceStore').listen(this.onInstanceChange.bind(this));
    appRegistry.on('collection-changed', this.onCollectionChanged.bind(this));
    appRegistry.on('database-changed', this.onDatabaseChanged.bind(this));
    appRegistry.on('data-service-disconnected', this.onDisconnected.bind(this));
  },

  onCollectionChanged(ns) {
    this.setState({
      activeNamespace: ns || ''
    });
  },

  onDatabaseChanged(ns) {
    this.setState({
      activeNamespace: ns || ''
    });
  },

  onDisconnected() {
    this.setState(this.getInitialState());
  },

  /**
  * Initialize the Compass Sidebar store state.
  *
  * @return {Object} initial store state.
  */
  getInitialState() {
    return {
      expandedDBList: false,
      instance: {
        databases: LOADING_STATE,
        collections: LOADING_STATE
      },
      databases: [],
      filterRegex: /(?:)/,
      activeNamespace: ''
    };
  },

  onInstanceChange(state) {
    this.setState({
      instance: state.instance,
      expandedDBList: this.state.filterRegex.source !== BLANK,
      databases: this._filterDatabases(this.state.filterRegex, state.instance.databases)
    });
  },

  filterDatabases(re) {
    this.setState({
      expandedDBList: re.source !== BLANK,
      databases: this._filterDatabases(re, this.state.instance.databases),
      filterRegex: re
    });
  },

  _filterDatabases(re, databases) {
    if (databases === LOADING_STATE ||
        // empty array vs Ampersand collection = technical debt
        Array.isArray(databases) && databases.length === 0 ||
        databases.isEmpty()) {
      return [];
    }

    return databases.reduce((filteredDbs, db) => {
      if (re.test(db._id)) {
        filteredDbs.push(db.toJSON());
      } else {
        const collections = db.collections.models.filter(c => re.test(c._id));
        if (collections.length) {
          filteredDbs.push({
            _id: db._id,
            collections
          });
        }
      }

      return filteredDbs;
    }, []);
  },

  /**
  * log changes to the store as debug messages.
  * @param  {Object} prevState   previous state.
  */
  storeDidUpdate(prevState) {
    debug('Sidebar store changed from', prevState, 'to', this.state);
  }
});

module.exports = SidebarStore;
