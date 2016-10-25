var AmpersandRouter = require('ampersand-router');
var qs = require('qs');
var _ = require('lodash');
var app = require('ampersand-app');

module.exports = AmpersandRouter.extend({
  routes: {
    '': 'index',
    schema: 'index',
    connect: 'connect',
    'schema/:ns': 'schema',
    '(*path)': 'catchAll'
  },
  index: function(queryString) {
    var params = qs.parse(queryString);

    if (_.has(params, 'connectionId')) {
      return app.setConnectionId(params.connectionId, () => this.schema());
    }
    this.connect();
  },
  schema: function(ns) {
    var HomePage = require('./home');
    this.trigger('page', new HomePage({
      ns: ns
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
