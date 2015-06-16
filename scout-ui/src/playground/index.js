var AmpersandView = require('ampersand-view');
var debug = require('debug')('scout-ui:playground:index');

// --- load your playground subview here ---
var MinichartsPlaygroundView = require('./minicharts');
// var MyPlaygroundView = require('./myplayground')


module.exports = AmpersandView.extend({
  template: require('./index.jade'),
  subviews: {
    minicharts: {
      hook: 'minicharts-container',
      constructor: MinichartsPlaygroundView
    },

    // --- and add the subview here ---

    // myPlayground: {
    //   hook: 'myplayground-container',    // also need to add the hook to index.jade
    //   constructor: MyPlaygroundView
    // }
  }
});
