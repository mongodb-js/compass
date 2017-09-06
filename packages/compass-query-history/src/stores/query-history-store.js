import Reflux from 'reflux';
import Actions from 'actions';
import StateMixin from 'reflux-state-mixin';
import mongodbns from 'mongodb-ns';

/**
 * QueryHistoryStore store.
 */
const QueryHistoryStore = Reflux.createStore({
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

  collapse() {
    this.setState({
      collapsed: true
    });
  },

  toggleCollapse() {
    this.setState({
      collapsed: !this.state.collapsed
    });
  },

  /**
   * Plugin lifecycle method that is called when the query changes in Compass.
   *
   * @param {object} query - the new query.
   */
  // Commented out because of https://jira.mongodb.org/browse/COMPASS-1619s
  // onQueryChanged(query) {
  //   Actions.addRecent(query);
  // },

  /**
   * Plugin lifecycle method that is called when the namespace changes in Compass.
   *
   * @param {string} namespace - the new namespace
   */
  onCollectionChanged(namespace) {
    const nsobj = mongodbns(namespace);
    if (nsobj.collection === '' || nsobj.ns === this.state.ns.ns) {
      return;
    }
    this.setState({
      ns: nsobj
    });
  },

  /**
   * Plugin lifecycle method that is called when the namespace changes in Compass.
   *
   * @param {string} namespace - the new namespace.
   */
  onDatabaseChanged(namespace) {
    const nsobj = mongodbns(namespace);
    if (!this.state.ns || this.state.ns.ns === nsobj.ns) {
      return;
    }
    if (nsobj.collection === '') {
      nsobj.collection = this.state.ns.collection;
    }
    this.setState({
      ns: nsobj
    });
  },

  /**
   * Initialize the Query History store state. The returned object must
   * contain all keys that you might want to modify with this.setState().
   *
   * @return {Object} initial store state.
   */
  getInitialState() {
    return {
      showing: 'recent',
      collapsed: false,
      ns: mongodbns('')
    };
  }
});

export default QueryHistoryStore;
export { QueryHistoryStore };
