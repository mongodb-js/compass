const React = require('react');
const app = require('ampersand-app');
const { shell } = require('electron');
const ipc = require('hadron-ipc');
const DatabasesActions = require('../action/databases-actions');
const CreateDatabaseDialog = require('./create-database-dialog');
const DropDatabaseDialog = require('./drop-database-dialog');
const { NamespaceStore } = require('hadron-reflux-store');
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
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
    this.Tooltip = app.appRegistry.getComponent('App.Tooltip');
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

  onNameClicked(name) {
    if (NamespaceStore.ns !== name) {
      this.CollectionStore.setCollection({});
      NamespaceStore.ns = name;
      ipc.call('window:hide-collection-submenu');
    }
  }

  onClickShowConnectWindow() {
    // code to close current connection window and open connect dialog
    ipc.call('app:show-connect-window');
    window.close();
  }

  renderNoCollections(isWritable) {
    return (
      <div className="no-collections-zero-state">
        The MongoDB instance you are connected to
        does not contain any collections, or you are
        <a onClick={this.onAuthHelpClicked.bind(this)}>not authorized</a>
        to view them.
        {!isWritable ?
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
      const dbName = db['Database Name'];
      return _.assign({}, db, {
        'Database Name': <a className="rtss-databases-link" href="#" onClick={this.onNameClicked.bind(this, dbName)}>{dbName}</a>,
        'Storage Size': numeral(db['Storage Size']).format('0.0b')
      });
    });

    const isWritable = app.dataService.isWritable();
    const tooltipText = 'This action is not available on a secondary node';

    return (
      <div className="rtss-databases" data-test-id="databases-table">
        <div className="rtss-databases-create-button action-bar controls-container">
          <div className="tooltip-button-wrapper" data-tip={tooltipText} data-for="is-not-writable">
            <button
                className="btn btn-primary btn-xs"
                type="button"
                data-test-id="open-create-database-modal-button"
                disabled={!isWritable}
                onClick={this.onCreateDatabaseButtonClicked.bind(this)}>
                Create Database
            </button>
          </div>
        </div>
        <div className="column-container">
          <div className="column main">
            <this.SortableTable
              theme="light"
              columns={this.props.columns}
              rows={rows}
              sortable
              sortOrder={this.props.sortOrder}
              sortColumn={this.props.sortColumn}
              valueIndex={0}
              removable={isWritable}
              onColumnHeaderClicked={this.onColumnHeaderClicked.bind(this)}
              onRowDeleteButtonClicked={this.onRowDeleteButtonClicked.bind(this)}
            />
          </div>
        </div>
        {this.props.databases.length === 0 ?
            this.renderNoCollections(isWritable) : null}
        <CreateDatabaseDialog />
        <DropDatabaseDialog />
      </div>
    );
  }
}

DatabasesTable.propTypes = {
  columns: React.PropTypes.arrayOf(React.PropTypes.string),
  databases: React.PropTypes.arrayOf(React.PropTypes.object),
  sortOrder: React.PropTypes.oneOf(['asc', 'desc']),
  sortColumn: React.PropTypes.string
};

DatabasesTable.displayName = 'DatabasesTable';

module.exports = DatabasesTable;
