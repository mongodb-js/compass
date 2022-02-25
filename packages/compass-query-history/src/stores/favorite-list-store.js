import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import { FavoriteQuery, FavoriteQueryCollection } from '../models';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { isDeepStrictEqual } from 'util';
const { track } = createLoggerAndTelemetry('COMPASS-QUERY-HISTORY-UI');

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
      track('Query History Favorite Added');
      options.actions.deleteRecent(recent); // If query shouldn't stay in recents after save

      const now = Date.now();
      const attributes = recent.getAttributes({ props: true });
      attributes._name = name;
      attributes._dateSaved = now;
      attributes._dateModified = now;

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
      track('Query History Favorite Removed', {
        id: query._id,
        screen: 'documents',
      });
      query.destroy({
        success: () => {
          this.state.items.remove(query._id);
          this.trigger(this.state);
        }
      });
    },

    runQuery(query) {
      // Loosely match queries against known history entries, because
      // currently we do not distinguish between favorites and recents
      // when running queries. This way, we do track some queries twice
      // (because there are more options than just .filter), but that
      // is probably fine as a temporary measure.
      // https://jira.mongodb.org/browse/COMPASS-5243
      const item = this.state.items
        .map((_item) => _item.serialize())
        .find((_item) => {
          return isDeepStrictEqual(_item.filter, query.filter);
        });
      if (item) {
        track('Query History Favorite Used', {
          id: item._id,
          screen: 'documents'
        });
      }
      this.localAppRegistry.emit('compass:query-history:run-query', query);
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

  if (options.localAppRegistry) {
    store.localAppRegistry = options.localAppRegistry;
  }

  return store;
};

export default configureStore;
