const Reflux = require('reflux');
const Actions = require('../actions');
const StateMixin = require('reflux-state-mixin');

const debug = require('debug')('mongodb-compass:query-history:favorites-store');

/**
 * Query History Favorites List store.
 */
const FavoritesListStore = Reflux.createStore({
  mixins: [StateMixin.store],

  listenables: Actions,

  init() {
  },

  addFavorites(recent) {
    this.setState({
      recents: this.state.recents.push(recent)
    });
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
      favorites: [],
      current_favorite: null
    };
  },

  storeDidUpdate(prevState) {
    debug('FavoritesListStore changed from', prevState, 'to', this.state);
  }
});

module.exports = FavoritesListStore;
