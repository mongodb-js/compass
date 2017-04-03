const React = require('react');
const { StoreConnector } = require('hadron-react-components');
const Home = require('./home');
const HomeStore = require('../store');

// const debug = require('debug')('mongodb-compass:home:index');

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
