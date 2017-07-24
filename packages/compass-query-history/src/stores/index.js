const Reflux = require('reflux');
const Actions = require('../actions');
const StateMixin = require('reflux-state-mixin');

/**
 * Query History store.
 */
const SidebarStore = Reflux.createStore({
  /**
   * adds a state to the store, similar to React.Component's state
   * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
   *
   * If you call `this.setState({...})` this will cause the store to trigger
   * and push down its state as props to connected components.
   */
  mixins: [StateMixin.store],

  /**
   * listen to all actions defined in ../actions/index.jsx
   */
  listenables: Actions,

  /**
   * Initialize everything that is not part of the store's state.
   */
  init() {
  },

  showFavorites() {
    this.setState({
      showing: 'favorites'
    });
  },

  showRecent() {
    this.setState({
      showing: 'recent'
    });
  },

  onQueryChanged(query) {
    Actions.addRecent(query);
  },

  /**
   * This method is called when all plugins are activated. You can register
   * listeners to other plugins' stores here, e.g.
   *
   * appRegistry.getStore('OtherPlugin.Store').listen(this.otherStoreChanged.bind(this));
   *
   * If this plugin does not depend on other stores, you can delete the method.
   *
   * @param {Object} appRegistry   app registry containing all stores and components
   */
  // onActivated(appRegistry){
  // },

  /**
   * This method is called when the data service is finished connecting. You
   * receive either an error or the connected data service object, and if the
   * connection was successful you can now make calls to the database, e.g.
   *
   * dataService.command('admin', {connectionStatus: 1}, this.handleStatus.bind(this));
   *
   * If this plugin does not need to talk to the database, you can delete this
   * method.
   *
   * @param {Object} error         the error object if connection was unsuccessful
   * @param {Object} dataService   the dataService object if connection was successful
   *
   */
  // onConnected(error, dataService) {
  // },

  /**
   * Initialize the Query History store state. The returned object must
   * contain all keys that you might want to modify with this.setState().
   *
   * @return {Object} initial store state.
   */
  getInitialState() {
    return {
      showing: 'recent'
    };
  }
});

module.exports = SidebarStore;
