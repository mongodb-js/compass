var AmpersandRouter = require('ampersand-router');

var HomePage = require('./home');
var ConnectPage = require('./connect');
var HelpPage = require('./help');

module.exports = AmpersandRouter.extend({
  routes: {
    '': 'index',
    schema: 'index',
    connect: 'connect',
    'schema/:ns': 'schema',
    'help': 'help',
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
  help: function(id) {
    this.trigger('page', new HelpPage({
      id: id
    }));
  },
  catchAll: function() {
    this.redirectTo('');
  },
  connect: function() {
    this.trigger('page', new ConnectPage({}));
  }
});
