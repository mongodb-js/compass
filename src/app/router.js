var AmpersandRouter = require('ampersand-router');
var qs = require('qs');
var _ = require('lodash');
var app = require('ampersand-app');
var React = require('react');
var ReactDOM = require('react-dom');
var debug = require('debug')('mongodb-compass:app:router');

module.exports = AmpersandRouter.extend({
  routes: {
    '': 'index',
    home: 'index',
    connect: 'connect',
    'home/:ns': 'home',
    'instance/:tab': 'instance',
    '(*path)': 'catchAll'
  },
  index: function(queryString) {
    var params = qs.parse(queryString);
    // set home view to null if blank route
    this.homeView = null;
    if (_.has(params, 'connectionId')) {
      return app.setConnectionId(params.connectionId, () => this.home());
    }

    if (app.connection) {
      return this.home();
    }
    this.connect();
  },
  // connection dialog route
  connect: function() {
    var ConnectPage = require('./connect');
    this.trigger('page', new ConnectPage({}));
  },
  // home window route
  home: function(ns) {
    this.homeView = app.appRegistry.getComponent('Home.Home');
    this.trigger('page',
      ReactDOM.render(
        React.createElement(this.homeView, {ns: ns}),
        app.state.queryByHook('layout-container')
    ));
  },
  // instance level route
  instance: function(tab) {
    debug('route: instance', tab);
    this.homeActions = app.appRegistry.getAction('Home.Actions');
    this.homeActions.renderRoute(tab);
  },
  catchAll: function() {
    this.redirectTo('');
  }
});
