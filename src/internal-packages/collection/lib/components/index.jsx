const React = require('react');
const app = require('ampersand-app');
const StoreConnector = app.appRegistry.getComponent('App.StoreConnector');

const Collection = require('./collection');
const Store = require('../store');

class ConnectedCollection extends React.Component {
  /**
   * Connect <Collection /> component to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={Store}>
        <Collection />
      </StoreConnector>
    );
  }
}

ConnectedCollection.displayName = 'ConnectedCollection';

module.exports = ConnectedCollection;
