const React = require('react');
const { StoreConnector } = require('hadron-react-components');
const SSHTunnelStatusComponent = require('./ssh-tunnel-status');
const Store = require('../stores');
const Actions = require('../actions');

// const debug = require('debug')('mongodb-compass:ssh-tunnel-status:index');

class ConnectedSSHTunnelStatusComponent extends React.Component {
  /**
   * Connect SSHTunnelStatusComponent to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={Store}>
        <SSHTunnelStatusComponent actions={Actions} />
      </StoreConnector>
    );
  }
}

ConnectedSSHTunnelStatusComponent.displayName = 'ConnectedSSHTunnelStatusComponent';

module.exports = ConnectedSSHTunnelStatusComponent;
