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

  onConnected() {
    this.state.favorites.fetch({ reset: true });
  },

  saveRecent(query) {
    this.setState({
      current_favorite: query
    });
    Actions.showFavorites();
  },

  saveFavorite(recent, name) {
    // Actions.deleteRecent(recent._id);

    const attributes = recent.serialize();
    attributes._name = name;
    attributes._dateSaved = Date.now();

    const query = new FavoriteQuery(attributes);

    this.state.favorites.add(query);
    query.save();
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
    query.destroy();
    this.trigger(this.state);
  },

  getInitialState() {
    return {
      favorites: new FavoriteQueryCollection(),
      current_favorite: null
    };
  }
});

module.exports = FavoritesListStore;
