const React = require('react');

const app = require('hadron-app');
const QueryBar = require('./query-bar');
const QueryActions = require('../action');
const QueryStore = require('../store/query-store');

// const debug = require('debug')('mongodb-compass:compass-explain:index');

class ConnectedQueryBar extends React.Component {

  constructor(props) {
    super(props);
    this.StoreConnector = app.appRegistry.getComponent('App.StoreConnector');
  }

  /**
   * Connect CompassExplainComponent to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <this.StoreConnector store={QueryStore}>
        <QueryBar actions={QueryActions} {...this.props} />
      </this.StoreConnector>
    );
  }
}

ConnectedQueryBar.displayName = 'ConnectedQueryBar';

module.exports = ConnectedQueryBar;
