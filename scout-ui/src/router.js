var AmpersandRouter = require('ampersand-router');

var HomePage = require('./home');
var PlaygroundPage = require('./playground');

module.exports = AmpersandRouter.extend({
  routes: {
    '': 'index',
    'schema': 'index',
    'schema/:ns': 'schema',
    'playground': 'playground',
    '(*path)': 'catchAll'
  },
  index: function() {
    this.trigger('page', new HomePage({}));
  },
  schema: function(ns) {
    this.trigger('page', new HomePage({
      ns: ns
    }));
  },
  playground: function() {
    this.trigger('page', new PlaygroundPage({}));
  },
  catchAll: function() {
    console.warn('catchAll!', arguments);
    this.redirectTo('');
  }
});
