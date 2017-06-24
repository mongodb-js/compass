const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');
const _ = require('lodash');
const Actions = require('../actions');

/**
* Compass Collection store.
*/
const CollectionStore = Reflux.createStore({
  /**
  * adds a state to the store, similar to React.Component's state
  * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
  */
  mixins: [StateMixin.store],

  listenables: Actions,

  onActivated(appRegistry) {
    // set up listeners on external stores
    appRegistry.getStore('Home.HomeStore').listen(this.onHomeChange.bind(this));
  },

  onCollectionChanged(namespace) {
    const isReadonly = _.first(_.pluck(_.filter(this.collections.models, (col) => {
      return col._id === namespace;
    }), 'readonly'));

    this.setState({namespace, isReadonly});
  },

  /**
  * Initialize the Compass Sidebar store state.
  *
  * @return {Object} initial store state.
  */
  getInitialState() {
    return {
      namespace: '',
      isReadonly: false
    };
  },

  onHomeChange(state) {
    this.collections = state.instance.collections;
  }
});

module.exports = CollectionStore;
