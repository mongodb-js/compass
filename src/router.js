var AmpersandRouter = require('ampersand-router');
var intercom = require('./intercom');
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
    intercom.track('Connected to MongoDB');
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
    intercom.track('App Launched');
    this.trigger('page', new Connect({}));
  }
});
