const React = require('react');
const app = require('ampersand-app');
const StoreConnector = app.appRegistry.getComponent('App.StoreConnector');

const Home = require('./home');
const Store = require('../store');

// const debug = require('debug')('mongodb-compass:validation:index');

class ConnectedHome extends React.Component {
  /**
   * Connect <Validation /> component to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={Store}>
        <Home />
      </StoreConnector>
    );
  }
}

ConnectedHome.displayName = 'ConnectedHome';

module.exports = ConnectedHome;
