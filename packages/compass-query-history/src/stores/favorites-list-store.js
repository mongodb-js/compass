const Reflux = require('reflux');
const Actions = require('../actions');
const StateMixin = require('reflux-state-mixin');
// const { Query, QueryCollection } = require('../../');
// const FilteredCollection = require('ampersand-filtered-subcollection');

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
    // @note: Durran: To save the favorite query:
    //   const attributes = recent.serialize();
    //   attributes.name = '';
    //   const query = new Query(attributes);
    //   query.save();
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
    // const queries = QueryCollection.fetch();
    // var favoriteQueries = new FilteredCollection(queries, {
      // where: {
        // isFavorite: true
      // },
      // comparator: (model) => {
        // return -model.lastExecuted;
      // }
    // });

    return {
      favorites: [], // QueryCollection.fetch();
      current_favorite: null
    };
  },

  storeDidUpdate(prevState) {
    debug('FavoritesListStore changed from', prevState, 'to', this.state);
  }
});

module.exports = FavoritesListStore;
