var View = require('ampersand-view');
var app = require('ampersand-app');
var debug = require('debug')('mongodb-compass:home');
var React = require('react');
var ReactDOM = require('react-dom');

var indexTemplate = require('./index.jade');

var HomeView = View.extend({
  screenName: 'Schema',
  initialize: function() {
    this.homeView = app.appRegistry.getComponent('Home.Home');

    this.once('change:rendered', this.onRendered);
    debug('fetching instance model...');
    app.instance.fetch();
  },
  render: function() {
    this.renderWithTemplate(this);
    // @KeyboardPirate running react Home through here because fetching instance is hard to work with
    ReactDOM.render(
        React.createElement(this.homeView),
        this.queryByHook('home-content'));
  },
  template: indexTemplate
});

module.exports = HomeView;
