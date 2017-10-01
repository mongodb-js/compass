const React = require('react');

const { StoreConnector } = require('hadron-react-components');
const QueryBar = require('./query-bar');
const QueryActions = require('../action');
const QueryStore = require('../store/query-store');

// const debug = require('debug')('mongodb-compass:compass-explain:index');

class ConnectedQueryBar extends React.Component {

  /**
   * Connect CompassExplainComponent to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={QueryStore}>
        <QueryBar actions={QueryActions} {...this.props} />
      </StoreConnector>
    );
  }
}

ConnectedQueryBar.displayName = 'ConnectedQueryBar';

module.exports = ConnectedQueryBar;
