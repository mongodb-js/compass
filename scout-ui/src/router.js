var AmpersandRouter = require('ampersand-router');

var HomePage = require('./home');

module.exports = AmpersandRouter.extend({
  routes: {
    '': 'index',
    '(*path)': 'catchAll'
  },
  index: function() {
    this.trigger('page', new HomePage({}));
  },
  catchAll: function() {
    console.warn('catchAll!', arguments);
    this.redirectTo('');
  }
});
