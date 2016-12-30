const React = require('react');

const app = require('ampersand-app');
const StoreConnector = app.appRegistry.getComponent('App.StoreConnector');
const QueryBar = require('./query-bar');
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
        <QueryBar {...this.props} />
      </StoreConnector>
    );
  }
}

ConnectedQueryBar.displayName = 'ConnectedQueryBar';

module.exports = ConnectedQueryBar;
