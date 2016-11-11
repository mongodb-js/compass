const _ = require('lodash');
const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');

const GlossaryActions = require('../actions');

const debug = require('debug')('mongodb-compass:stores:glossary');

const GlossaryStore = Reflux.createStore({
  mixins: [StateMixin.store],

  listenables: [GlossaryActions],

  init() {},

  getInitialState() {
    return {
      entry: {}
    };
  },

  addComponent(name, state, getFn) {
    const entry = _.clone(this.state.entry);
    if (!entry[name]) {
      entry[name] = {};
    }

    if (entry[name][state]) {
      debug(`A component for ${name} has already been created for state "${state}"`);
      return;
    }

    entry[name][state] = getFn;
    this.setState({ entry });
  }
});

module.exports = GlossaryStore;
