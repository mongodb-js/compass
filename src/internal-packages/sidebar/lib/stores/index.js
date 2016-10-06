const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');

const SidebarActions = require('../actions');
const InstanceActions = require('../../../app/actions/instance-actions');

const debug = require('debug')('mongodb-compass:stores:sidebar');

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
  listenables: [InstanceActions, SidebarActions],

  /**
  * Initialize everything that is not part of the store's state.
  */
  init() {},

  /**
  * Initialize the Compass Sidebar store state.
  *
  * @return {Object} initial store state.
  */
  getInitialState() {
    debug('getInitialState');
    return {
      status: 'disabled',
      instance: {},
      databases: []
    };
  },

  setInstance(instance) {
    debug('updateInstance');

    this.setState({
      instance: instance,
      databases: instance.databases.toJSON()
    });
  },

  filterDatabases(re) {
    debug('filterDatabases');
    const originalDatabaseList = this.state.instance.databases;
    if (originalDatabaseList.isEmpty()) {
      return;
    }

    const databases = [];
    originalDatabaseList.forEach(db => {
      if (re.test(db._id)) {
        databases.push(db.toJSON());
        return;
      }

      const collections = db.collections.models.filter(c => re.test(c._id));
      if (collections.length) {
        databases.push({
          _id: db._id,
          collections
        });
      }
    });

    this.setState({ databases });
  },

  /**
  * handlers for each action defined in ../actions/index.jsx, for example:
  */
  toggleStatus() {
    this.setState({
      status: this.state.status === 'enabled' ? 'disabled' : 'enabled'
    });
  },

  /**
  * log changes to the store as debug messages.
  * @param  {Object} prevState   previous state.
  */
  storeDidUpdate(prevState) {
    debug('Sidebar store changed from %j to %j', prevState, this.state);
  }
});

module.exports = SidebarStore;
