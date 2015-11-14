var AmpersandRouter = require('ampersand-router');

var HomePage = require('./home');
var ConnectPage = require('./connect');
var HelpPage = require('./help');

module.exports = AmpersandRouter.extend({
  routes: {
    '': 'connect',
    schema: 'index',
    connect: 'connect',
    'schema/:ns': 'schema',
    help: 'help',
    'help/:itemId': 'help',
    '(*path)': 'catchAll'
  },
  schema: function(ns) {
    this.trigger('page', new HomePage({
      ns: ns
    }));
  },
  help: function(itemId) {
    this.trigger('page', new HelpPage({
      itemId: itemId
    }));
  },
  catchAll: function() {
    this.redirectTo('');
  },
  connect: function() {
    this.trigger('page', new ConnectPage({}));
  }
});
