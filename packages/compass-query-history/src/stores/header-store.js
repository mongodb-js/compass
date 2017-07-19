const Reflux = require('reflux');
const Actions = require('../actions');
const StateMixin = require('reflux-state-mixin');

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

module.exports = HeaderStore;
