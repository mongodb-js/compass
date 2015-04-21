var AmpersandRouter = require('ampersand-router');

var HomePage = require('./home');

module.exports = AmpersandRouter.extend({
  routes: {
    '': 'index',
    'schema': 'index',
    'schema/:ns': 'schema',
    '(*path)': 'catchAll'
  },
  index: function() {
    this.trigger('page', new HomePage({}));
  },
  schema: function(ns) {
    this.trigger('page', new HomePage({ns: ns}));
  },
  catchAll: function() {
    console.warn('catchAll!', arguments);
    this.redirectTo('');
  }
});
