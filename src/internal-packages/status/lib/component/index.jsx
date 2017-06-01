const React = require('react');

const { StoreConnector } = require('hadron-react-components');
const Status = require('./status');
const Store = require('../store');
const Actions = require('../action');

// const debug = require('debug')('mongodb-compass:compass-explain:index');

class ConnectedStatus extends React.Component {

  /**
   * Connect CompassExplainComponent to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={Store}>
        <Status actions={Actions} {...this.props} />
      </StoreConnector>
    );
  }
}

ConnectedStatus.displayName = 'ConnectedStatus';

module.exports = ConnectedStatus;
