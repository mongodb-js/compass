const AmpersandRouter = require('ampersand-router');
const React = require('react');
const ReactDOM = require('react-dom');

module.exports = AmpersandRouter.extend({
  routes: {
    '': 'home'
  },
  home: function(ns) {
    this.homeView = global.hadronApp.appRegistry.getComponent('Home.Home');
    this.trigger('page',
      ReactDOM.render(
        React.createElement(this.homeView, {ns: ns}),
        global.hadronApp.state.queryByHook('layout-container')
      ));
  }
});
