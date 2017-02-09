const Reflux = require('reflux');
const app = require('ampersand-app');
const clippings = require('../constants');
const IndexActions = require('../../indexes/lib/action/index-actions');

const _ = require('lodash');

const ClippyStore = Reflux.createStore({
  init: function() {
    this.randomSpeak.bind(this);
    this.listenToExternalStore('Query.Store', this.clipQuery.bind(this));
    this.listenTo(IndexActions.toggleModal, this.clipIndexButton);
    this.listenToExternalStore('Explain.Store', this.clipExplain.bind(this));
    this.listenToExternalStore('App.InstanceStore', this.clipStartup.bind(this));
    this.listenToExternalStore('Indexes.IndexStore', this.clipIndexButton.bind(this));
  },

  randomSpeak: function(messages) {
    return messages[_.random(0, messages.length - 1)];
  },

  /**
   * @param {Reflux.store} state - state of the QueryStore
   */
  clipQuery: function(state) {
    // do a regex test for {"objectID": ......}
    console.info('query is changing: ', state);
    if (_.includes(state.filterString, 'ObjectID')) {
      const messages = clippings.Query.bad.message;
      const animations = clippings.Query.bad.animation;
      app.clippy.stop();
      app.clippy.animate(animations[_.random(0, animations.length - 1)]);
      app.clippy.speak(messages[_.random(0, messages.length - 1)]);
    }
  },

  clipExplain: function(state) {
    console.info('explain', state);
    if (state.indexType === 'COLLSCAN') {
      const messages = clippings.Explain.bad.message;
      app.clippy.stop();
      app.clippy.speak(this.randomSpeak(messages));
    }
    if (state.executionTimeMillis > 100) {
      const messages = clippings.Explain.bad.slow;
      app.clippy.speak(this.randomSpeak(messages));
    }
  },

  clipStartup: function() {
    if (app.connection.authentication === 'NONE') {
      const messages = clippings.Startup.bad.auth;
      app.clippy.speak(this.randomSpeak(messages));
      app.clippy.play('GetAttention');
      app.clippy.speak('Seriously dude');
      app.clippy.animate();
    }
    if (app.instance.build.version.startsWith('2.')) {
      const messages = clippings.Startup.bad.outdated;
      app.clippy.speak(this.randomSpeak(messages));
    }
  },

  clipIndexButton: function(state) {
    console.info('index state', state);
  }
});

module.exports = ClippyStore;
