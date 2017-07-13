const Reflux = require('reflux');
const Actions = require('../actions');
const StateMixin = require('reflux-state-mixin');

const debug = require('debug')('mongodb-compass:query-history:header-store');

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
  },

  storeDidUpdate(prevState) {
    debug('HeaderStore changed from', prevState, 'to', this.state);
  }
});

module.exports = HeaderStore;
