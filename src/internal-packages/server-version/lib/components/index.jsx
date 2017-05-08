const React = require('react');
const { StoreConnector } = require('hadron-react-components');
const ServerVersionComponent = require('./server-version');
const Store = require('../stores');

// const debug = require('debug')('mongodb-compass:server-version:index');

class ConnectedServerVersionComponent extends React.Component {
  /**
   * Connect ServerVersionComponent to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={Store}>
        <ServerVersionComponent />
      </StoreConnector>
    );
  }
}

ConnectedServerVersionComponent.displayName = 'ConnectedServerVersionComponent';

module.exports = ConnectedServerVersionComponent;
