var AmpersandRouter = require('ampersand-router');
var qs = require('qs');
var _ = require('lodash');
var app = require('ampersand-app');
var HomePage = require('./home');

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

    if (app.connection) {
      return this.schema();
    }
    this.connect();
  },
  schema: function(ns) {
    this.homeView = app.appRegistry.getComponent('Home.Home');
    this.trigger('page', new HomePage({ns: ns}));
    // this.trigger('page', ReactDOM.render(
    //   React.createElement(this.homeView, {ns: ns}),
    //   app.state.queryByHook('layout-container')
    // ));
  },
  catchAll: function() {
    this.redirectTo('');
  },
  connect: function() {
    var ConnectPage = require('./connect');
    this.trigger('page', new ConnectPage({}));
  }
});
