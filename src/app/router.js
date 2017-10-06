var AmpersandRouter = require('ampersand-router');
var app = require('hadron-app');
var React = require('react');
var ReactDOM = require('react-dom');

module.exports = AmpersandRouter.extend({
  routes: {
    '': 'home',
    home: 'home',
    'home/:ns': 'home',
    '(*path)': 'catchAll'
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
  }
});
