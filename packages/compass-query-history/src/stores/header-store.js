import Reflux from 'reflux';
import Actions from 'actions';
import StateMixin from 'reflux-state-mixin';

/**
 * Query History Header store.
 */
const HeaderStore = Reflux.createStore({
  mixins: [StateMixin.store],

  listenables: Actions,

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

export default HeaderStore;
export { HeaderStore };
