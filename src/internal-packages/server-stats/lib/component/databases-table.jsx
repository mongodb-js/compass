const React = require('react');
const app = require('ampersand-app');
const TextButton = require('hadron-app-registry').TextButton;
const DatabasesActions = require('../action/databases-actions');
const CreateDatabaseDialog = require('./create-database-dialog');
const DropDatabaseDialog = require('./drop-database-dialog');
const numeral = require('numeral');

const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:server-stats:databases');

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
      <div className="rtss-databases">
        <div className="rtss-databases-create-button action-bar">
          {writable ?
            <TextButton
              text="Create Database"
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
