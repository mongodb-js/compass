import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import Actions from 'actions';
import { FavoriteQuery, FavoriteQueryCollection } from 'models';

/**
 * Query History Favorites List store.
 */
const FavoriteListStore = Reflux.createStore({
  mixins: [StateMixin.store],

  listenables: Actions,

  /**
   * Get the queries stored on disk.
   */
  onActivated(appRegistry) {
    appRegistry.on('data-service-connected', () => {
      this.state.items.fetch({
        success: () => {
          this.trigger(this.state);
        }
      });
    });
  },

  saveRecent(query) {
    this.setState({
      current: query
    });
    Actions.showFavorites();
  },

  saveFavorite(recent, name) {
    Actions.deleteRecent(recent); // If query shouldn't stay in recents after save

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
    Actions.showRecent();
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

export default FavoriteListStore;
export { FavoriteListStore };
