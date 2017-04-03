const React = require('react');

const { StoreConnector } = require('hadron-react-components');
const CompassExplain = require('./compass-explain');
const Store = require('../stores');

// const debug = require('debug')('mongodb-compass:compass-explain:index');

class ConnectedCompassExplain extends React.Component {

  /**
   * Connect CompassExplainComponent to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={Store}>
        <CompassExplain />
      </StoreConnector>
    );
  }
}

ConnectedCompassExplain.displayName = 'ConnectedCompassExplain';

module.exports = ConnectedCompassExplain;
