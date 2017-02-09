const Reflux = require('reflux');
const app = require('ampersand-app');
const clippings = require('../constants');
const IndexActions = require('../../indexes/lib/action/index-actions');

const _ = require('lodash');

const ClippyStore = Reflux.createStore({
  init: function() {
    this.listenToExternalStore('Query.Store', this.clipQuery.bind(this));
    this.listenTo(IndexActions.toggleModal, this.clipIndexButton);
  },

  /**
   * @param {Reflux.store} state - state of the QueryStore
   */
  clipQuery: function(state) {
    // do a regex test for {"objectID": ......}
    console.log('query is changing: ', state);
    const messages = clippings.Query.bad.message;
    const animations = clippings.Query.bad.animation;
    app.clippy.stopCurrent();
    app.clippy.animate(animations[_.random(0, animations.length - 1)]);
    app.clippy.speak(messages[_.random(0, messages.length - 1)]);
  },

  clipIndexButton: function(state) {
    console.info('index state', state);
  }
});

module.exports = ClippyStore;
