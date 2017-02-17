const React = require('react');

const app = require('hadron-app');
const DatabasesStore = require('../store/databases-store');
const DatabasesTable = require('./databases-table');

// const debug = require('debug')('mongodb-compass:compass-explain:index');

class ConnectedDatabasesTable extends React.Component {

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
      <this.StoreConnector store={DatabasesStore}>
        <DatabasesTable />
      </this.StoreConnector>
    );
  }
}

ConnectedDatabasesTable.displayName = 'ConnectedDatabasesTable';

module.exports = ConnectedDatabasesTable;
