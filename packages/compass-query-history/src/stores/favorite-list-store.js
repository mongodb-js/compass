import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import { FavoriteQuery, FavoriteQueryCollection } from 'models';

/**
 * Query History Favorites List store.
 */
const configureStore = (options = {}) => {
  const store = Reflux.createStore({
    mixins: [StateMixin.store],

    listenables: options.actions,

    saveRecent(query) {
      this.setState({
        current: query
      });
      options.actions.showFavorites();
    },

    saveFavorite(recent, name) {
      options.actions.deleteRecent(recent); // If query shouldn't stay in recents after save

      const attributes = recent.getAttributes({ props: true });
      attributes._name = name;
      attributes._dateSaved = Date.now();

      const query = new FavoriteQuery(attributes);

      this.state.items.add(query);
      query.save();
      this.state.current = null;
      this.trigger(this.state);
    },

    cancelSave() {
      this.setState({
        current: null
      });
      options.actions.showRecent();
    },

    deleteFavorite(query) {
      query.destroy({
        success: () => {
          this.state.items.remove(query._id);
          this.trigger(this.state);
        }
      });
    },

    getInitialState() {
      return {
        items: new FavoriteQueryCollection(),
        current: null
      };
    }
  });

  store.state.items.fetch({
    success: () => {
      store.trigger(store.state);
    }
  });

  return store;
};

export default configureStore;
