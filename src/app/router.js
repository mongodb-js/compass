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
    'home/:tab': 'home',
    // 'home/:tab/:query': 'home',
    '(*path)': 'catchAll'
  },
  index: function(queryString) {
    var params = qs.parse(queryString);
    // set home view to null if blank route
    this.homeView = null;
    this.homeActions = app.appRegistry.getAction('Home.Actions');
    if (_.has(params, 'connectionId')) {
      return app.setConnectionId(params.connectionId, () => this.home());
    }

    if (app.connection) {
      return this.home();
    }
    this.connect();
  },
  home: function(tab, query) {
    if (this.homeView === null) {
      debug('initialising home view render');
      this.homeView = app.appRegistry.getComponent('Home.Home');
      this.trigger('page', ReactDOM.render(
        React.createElement(this.homeView),
        app.state.queryByHook('layout-container')));
    }

    this.homeActions.renderRoute(tab);
  },
  catchAll: function() {
    this.redirectTo('');
  },
  connect: function() {
    var ConnectPage = require('./connect');
    this.trigger('page', new ConnectPage({}));
  }
});
