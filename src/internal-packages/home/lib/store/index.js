const app = require('ampersand-app');
const Reflux = require('reflux');
// const toNS = require('mongodb-ns');
const HomeActions = require('../actions');
const StateMixin = require('reflux-state-mixin');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const toNS = require('mongodb-ns');
const InstanceActions = app.appRegistry.getAction('App.InstanceActions');

const debug = require('debug')('mongodb-compass:stores:home');


const HomeStore = Reflux.createStore({

  mixins: [StateMixin.store],

  /**
   * listen to all actions defined in ../actions/index.jsx
   */
  listenables: [InstanceActions, HomeActions],

  /**
   * Initialize home store
   */
  init() {
    NamespaceStore.listen(this.switchContent.bind(this)); // (HomeActions.switchContent);
  },

  getInitialState() {
    return {
      // mode can be one of instance, database, collection
      mode: 'instance',
      hasContent: false
    };
  },

  /**
   * change content based on namespace
   * @param  {object} namespace current namespace context
   */
  switchContent(namespace) {
    const ns = toNS(namespace);
    if (ns.database === '') {
      this.setState({mode: 'instance'});
    } else if (ns.collection === '') {
      // a database was clicked, render collections table
      this.setState({mode: 'database'});
    } else {
      // show collection view
      this.setState({mode: 'collection'});
    }
    this.updateTitle(ns);
  },

  updateTitle: function(ns) {
    let title = 'MongoDB Compass - ' + app.connection.instance_id;
    if (ns) {
      title += '/' + ns;
    }
    document.title = title;
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
