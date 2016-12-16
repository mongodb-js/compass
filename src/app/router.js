var AmpersandRouter = require('ampersand-router');
var qs = require('qs');
var _ = require('lodash');
var app = require('ampersand-app');
var React = require('react');
var ReactDOM = require('react-dom');

module.exports = AmpersandRouter.extend({
  routes: {
    '': 'index',
    home: 'index',
    connect: 'connect',
    'home/:ns': 'home',
    '(*path)': 'catchAll'
  },
  index: function(queryString) {
    var params = qs.parse(queryString);
    if (_.has(params, 'connectionId')) {
      return app.setConnectionId(params.connectionId, () => this.home());
    }

    if (app.connection) {
      return this.home();
    }
    this.connect();
  },
  home: function(ns) {
    this.homeView = app.appRegistry.getComponent('Home.Home');
    this.trigger('page',
      ReactDOM.render(
        React.createElement(this.homeView, {ns: ns}),
        app.state.queryByHook('layout-container')
    ));
  },
  catchAll: function() {
    this.redirectTo('');
  },
  connect: function() {
    var ConnectPage = require('./connect');
    this.trigger('page', new ConnectPage({}));
  }
});
