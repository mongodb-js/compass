var AmpersandRouter = require('ampersand-router');

var HomePage = require('./home');
var Connect = require('./connect');

module.exports = AmpersandRouter.extend({
  routes: {
    '': 'index',
    schema: 'index',
    connect: 'connect',
    'schema/:ns': 'schema',
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
  catchAll: function() {
    this.redirectTo('');
  },
  connect: function() {
    this.trigger('page', new Connect({}));
  }
});
