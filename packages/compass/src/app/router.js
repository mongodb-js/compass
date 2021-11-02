const AmpersandRouter = require('ampersand-router');
const React = require('react');
const ReactDOM = require('react-dom');
const { remote } = require('electron');

module.exports = AmpersandRouter.extend({
  routes: {
    '': 'home'
  },
  home: function() {
    this.homeView = global.hadronApp.appRegistry.getComponent('Home.Home');
    this.trigger('page',
      ReactDOM.render(
        React.createElement(this.homeView, {
          appRegistry: global.hadronApp.appRegistry,
          appName: remote.app.getName()
        }),
        global.hadronApp.state.queryByHook('layout-container')
      ));
  }
});
