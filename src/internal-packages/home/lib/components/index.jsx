const React = require('react');
const app = require('ampersand-app');
const StoreConnector = app.appRegistry.getComponent('App.StoreConnector');

const Home = require('./home');
const HomeStore = require('../store');

// const debug = require('debug')('mongodb-compass:validation:index');

class ConnectedHome extends React.Component {
  /**
   * Connect <Home /> component to home store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={HomeStore}>
        <Home />
      </StoreConnector>
    );
  }
}

ConnectedHome.displayName = 'ConnectedHome';

module.exports = ConnectedHome;
