var AmpersandRouter = require('ampersand-router');
module.exports = AmpersandRouter.extend({
  routes: {
    '': 'index',
    schema: 'index',
    connect: 'connect',
    'schema/:ns': 'schema',
    help: 'help',
    'help/:entryId': 'help',
    '(*path)': 'catchAll'
  },
  index: function() {
    this.schema();
  },
  schema: function(ns) {
    var HomePage = require('./home');
    this.trigger('page', new HomePage({
      ns: ns
    }));
  },
  help: function(entryId) {
    var HelpPage = require('./help');
    this.trigger('page', new HelpPage({
      entryId: entryId
    }));
  },
  catchAll: function() {
    this.redirectTo('');
  },
  connect: function() {
    var ConnectPage = require('./connect');
    this.trigger('page', new ConnectPage({}));
  }
});
