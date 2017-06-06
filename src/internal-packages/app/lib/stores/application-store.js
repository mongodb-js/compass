const Reflux = require('reflux');
const ApplicationActions = require('../actions/application-actions');
const StateMixin = require('reflux-state-mixin');

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
