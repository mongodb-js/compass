const React = require('react');
const app = require('ampersand-app');
const { shell } = require('electron');
const ipc = require('hadron-ipc');
const { TextButton } = require('hadron-react-buttons');
const DatabasesActions = require('../action/databases-actions');
const CreateDatabaseDialog = require('./create-database-dialog');
const DropDatabaseDialog = require('./drop-database-dialog');
const numeral = require('numeral');

const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:server-stats:databases');

/**
 * The help url linking to role-based authorization.
 */
const AUTH_HELP_URL = 'https://docs.mongodb.com/master/core/authorization/';

class DatabasesTable extends React.Component {

  constructor(props) {
    super(props);
    this.SortableTable = app.appRegistry.getComponent('App.SortableTable');
  }

  onColumnHeaderClicked(column, order) {
    DatabasesActions.sortDatabases(column, order);
  }

  onRowDeleteButtonClicked(index, dbName) {
    DatabasesActions.openDropDatabaseDialog(dbName);
  }

  onCreateDatabaseButtonClicked() {
    DatabasesActions.openCreateDatabaseDialog();
  }

  onAuthHelpClicked(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    shell.openExternal(AUTH_HELP_URL);
  }

  onClickShowConnectWindow() {
    // code to close current connection window and open connect dialog
    ipc.call('app:show-connect-window');
    window.close();
  }

  renderNoCollections(writable) {
    return (
      <div className="no-collections-zero-state">
        The MongoDB instance you are connected to
        does not contain any collections, or you are
        <a onClick={this.onAuthHelpClicked.bind(this)}>not authorized</a>
        to view them.
        {!writable ?
          <a className="show-connect-window"
             onClick={this.onClickShowConnectWindow.bind(this)}
          >Connect to another instance</a>
          : null}
      </div>
    );
  }

  render() {
    // convert storage size to human-readable units (MB, GB, ...)
    // we do this here so that sorting is not affected in the store
    const rows = _.map(this.props.databases, (db) => {
      return _.assign({}, db, {
        'Storage Size': numeral(db['Storage Size']).format('0.0b')
      });
    });

    const writable = app.dataService.isWritable();

    return (
      <div className="rtss-databases" data-test-id="databases-table">
        <div className="rtss-databases-create-button action-bar">
          {writable ?
            <TextButton
              text="Create Database"
              dataTestId="open-create-database-modal-button"
              className="btn btn-primary btn-xs"
              clickHandler={this.onCreateDatabaseButtonClicked.bind(this)} /> : null}
        </div>
        <this.SortableTable
          theme="light"
          columns={this.props.columns}
          rows={rows}
          sortable
          sortOrder={this.props.sortOrder}
          sortColumn={this.props.sortColumn}
          valueIndex={0}
          removable={writable}
          onColumnHeaderClicked={this.onColumnHeaderClicked.bind(this)}
          onRowDeleteButtonClicked={this.onRowDeleteButtonClicked.bind(this)}
        />
        {this.props.databases.length === 0 ?
            this.renderNoCollections(writable) : null}
        <CreateDatabaseDialog />
        <DropDatabaseDialog />
      </div>
    );
  }
}

DatabasesTable.propTypes = {
  columns: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  databases: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
  sortOrder: React.PropTypes.oneOf(['asc', 'desc']),
  sortColumn: React.PropTypes.string
};

DatabasesTable.displayName = 'DatabasesTable';

module.exports = DatabasesTable;
