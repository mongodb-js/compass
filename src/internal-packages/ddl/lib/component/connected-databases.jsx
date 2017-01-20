const React = require('react');

const app = require('ampersand-app');
const StoreConnector = app.appRegistry.getComponent('App.StoreConnector');
const DatabasesStore = require('../store/databases-store');
const DatabasesTable = require('./databases-table');

// const debug = require('debug')('mongodb-compass:compass-explain:index');

class ConnectedDatabasesTable extends React.Component {

  /**
   * Connect CompassExplainComponent to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={DatabasesStore}>
        <DatabasesTable />
      </StoreConnector>
    );
  }
}

ConnectedDatabasesTable.displayName = 'ConnectedDatabasesTable';

module.exports = ConnectedDatabasesTable;
