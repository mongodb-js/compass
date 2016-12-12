const app = require('ampersand-app');
const Reflux = require('reflux');
// const toNS = require('mongodb-ns');
const HomeActions = require('../actions');
const StateMixin = require('reflux-state-mixin');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;

const debug = require('debug')('mongodb-compass:stores:home');


const HomeStore = Reflux.createStore({

  mixins: [StateMixin.store],

  /**
   * listen to all actions defined in ../actions/index.jsx
   */
  listenables: [HomeActions],

  /**
   * Initialize home store
   */
  init() {
    NamespaceStore.listen(HomeActions.switchContent);
  },

  getInitialState() {
    return {
      hasContent: false
    };
  },

  /**
   * change content based on namespace
   * @param  {object} ns namespace
   */
  switchContent() {
  },

  /**
  * log changes to the store as debug messages.
  * @param  {Object} prevState   previous state.
  */
  storeDidUpdate(prevState) {
    debug('Sidebar store changed from', prevState, 'to', this.state);
  }
});

module.exports = HomeStore;
