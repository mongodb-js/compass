const Reflux = require('reflux');
const QueryHistoryActions = require('../actions');
const StateMixin = require('reflux-state-mixin');

const FavoriteComponent = require('../components/query-history-favorite-component');
const RecentComponent = require('../components/query-history-recent-component');

const debug = require('debug')('mongodb-compass:stores:query-history-list-store');

/**
 * Query History List store.
 */
const QueryHistoryListStore = Reflux.createStore({
  mixins: [StateMixin.store],

  listenables: QueryHistoryActions,

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

  addRecent(recent) {
    this.setState({
      recents: this.state.recents.push(recent)
    });
  },

  addFavorite(favorite) {
    this.setState({
      current_favorite: favorite
    })
  },

  saveFavorite(name) {
    this.state.current_favorite.setName(name);
    this.setState({
      favorites: this.state.favorites.push(this.state.current_favorite)
    });
    this.state.current_favorite = null;
  },

  getInitialState() {
    return {
      showing: 'recent',
      favorites: [ FavoriteComponent ], // TODO
      recents: [ RecentComponent ], // TODO
      current_favorite: null
    };
  },

  storeDidUpdate(prevState) {
    debug('QueryHistoryListStore changed from', prevState, 'to', this.state);
  }
});

module.exports = QueryHistoryListStore;
