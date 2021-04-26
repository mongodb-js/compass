import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';

/**
 * Query History Header store.
 */
const configureStore = (options = {}) => {
  const store = Reflux.createStore({
    mixins: [StateMixin.store],

    listenables: options.actions,

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

    getInitialState() {
      return {
        showing: 'recent'
      };
    }
  });

  return store;
};

export default configureStore;
