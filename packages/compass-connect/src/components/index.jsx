const React = require('react');
const { StoreConnector } = require('hadron-react-components');
const Connect = require('./connect');
const Store = require('../stores');
const Actions = require('../actions');

class ConnectedConnect extends React.Component {

  /**
   * Connect Connect Component to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={Store}>
        <Connect actions={Actions} {...this.props} />
      </StoreConnector>
    );
  }
}

ConnectedConnect.displayName = 'ConnectedConnect';

module.exports = ConnectedConnect;
