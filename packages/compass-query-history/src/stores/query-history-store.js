import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import mongodbns from 'mongodb-ns';
import configureFavoriteListStore from './favorite-list-store';
import configureRecentListStore from './recent-list-store';
import configureHeaderStore from './header-store';

const FAVORITE_LIST_STORE = 'QueryHistory.FavoriteListStore';
const RECENT_LIST_STORE = 'QueryHistory.RecentListStore';
const HEADER_STORE = 'QueryHistory.HeaderStore';

/**
 * QueryHistoryStore store.
 */
const configureStore = (options = {}) => {
  const store = Reflux.createStore({
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
    listenables: options.actions,

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
     * Plugin lifecycle method that is called when the namespace changes in Compass.
     *
     * @param {string} namespace - the new namespace
     */
    onCollectionChanged(namespace) {
      const nsobj = mongodbns(namespace);
      this.setState({ ns: nsobj });
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
        collapsed: true,
        ns: mongodbns('')
      };
    }
  });

  if (options.namespace) {
    store.onCollectionChanged(options.namespace);
  }

  if (options.localAppRegistry) {
    const localAppRegistry = options.localAppRegistry;

    localAppRegistry.on('collapse-query-history', () => {
      store.collapse();
    });

    localAppRegistry.on('toggle-query-history', () => {
      store.toggleCollapse();
    });

    // Configure all the other stores.
    const favoriteListStore = localAppRegistry.getStore(FAVORITE_LIST_STORE);
    const recentListStore = localAppRegistry.getStore(RECENT_LIST_STORE);
    const headerStore = localAppRegistry.getStore(HEADER_STORE);

    if (!favoriteListStore.saveRecent) {
      localAppRegistry.registerStore(FAVORITE_LIST_STORE, configureFavoriteListStore(options));
    }

    if (!recentListStore.addRecent) {
      localAppRegistry.registerStore(RECENT_LIST_STORE, configureRecentListStore(options));
    }

    if (!headerStore.showRecent) {
      localAppRegistry.registerStore(HEADER_STORE, configureHeaderStore(options));
    }

    store.localAppRegistry = localAppRegistry;
  }

  return store;
};

export default configureStore;
