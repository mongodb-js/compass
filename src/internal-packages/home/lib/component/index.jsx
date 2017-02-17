const React = require('react');
const app = require('hadron-app');

const Home = require('./home');
const HomeStore = require('../store');

// const debug = require('debug')('mongodb-compass:home:index');

class ConnectedHome extends React.Component {

  constructor(props) {
    super(props);
    this.StoreConnector = app.appRegistry.getComponent('App.StoreConnector');
  }

  /**
   * Connect <Home /> component to home store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <this.StoreConnector store={HomeStore}>
        <Home />
      </this.StoreConnector>
    );
  }
}

ConnectedHome.displayName = 'ConnectedHome';

module.exports = ConnectedHome;
