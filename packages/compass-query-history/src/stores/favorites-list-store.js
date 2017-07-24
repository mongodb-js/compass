const Reflux = require('reflux');
const Actions = require('../actions');
const StateMixin = require('reflux-state-mixin');
const FavoriteQuery = require('../models/favorite-query');
const FavoriteQueryCollection = require('../models/favorite-query-collection');

// const debug = require('debug')('mongodb-compass:query-history:favorites-store');

/**
 * Query History Favorites List store.
 */
const FavoritesListStore = Reflux.createStore({
  mixins: [StateMixin.store],

  listenables: Actions,

  saveRecent(query) {
    this.setState({
      current_favorite: query
    });
    Actions.showFavorites();
  },

  saveFavorite(recent, name) {
    // Actions.deleteRecent(recent._id);

    const attributes = recent.serialize();
    attributes.name = name;
    attributes.dateSaved = Date.now();

    const query = new FavoriteQuery(attributes);

    this.state.favorites.add(query);
    this.state.current_favorite = null;
    this.trigger(this.state);
  },

  cancelSave() {
    this.setState({
      current_favorite: null
    });
    Actions.showRecent();
  },

  deleteFavorite(query) {
    this.state.favorites.remove(query._id);
    this.trigger(this.state);
  },

  getInitialState() {
    const favorites = new FavoriteQueryCollection();
    return {
      favorites: favorites,
      current_favorite: null
    };
  }
});

module.exports = FavoritesListStore;
