const Reflux = require('reflux');
const ApplicationActions = require('../actions/application-actions');
const StateMixin = require('reflux-state-mixin');

// Currently a placeholder
// Replace hadron-reflux-store.ApplicationStore with this
const ApplicationStore = Reflux.createStore({

  mixins: [StateMixin.store],

  listenables: ApplicationActions,

  init() {},

  getInitialState() {
    return {
      dataService: null
    };
  },

  setDataService(dataService) {
    this.setState({ dataService });
  }
});

module.exports = ApplicationStore;
