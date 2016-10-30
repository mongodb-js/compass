const React = require('react');
const app = require('ampersand-app');
const DatabasesActions = require('../action/databases-actions');
const SortableTable = app.appRegistry.getComponent('App.SortableTable');
const numeral = require('numeral');

const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:server-stats:databases');

class DatabasesTable extends React.Component {

  onColumnHeaderClicked(column, order) {
    DatabasesActions.sortDatabases(column, order);
  }

  onRowDeleteButtonClicked(dbName) {
    DatabasesActions.deleteDatabase(dbName);
  }

  render() {
    // convert storage size to human-readable units (MB, GB, ...)
    // we do this here so that sorting is not affected in the store
    const rows = _.map(this.props.databases, (db) => {
      return _.assign({}, db, {
        'Storage Size': numeral(db['Storage Size']).format('0.0b')
      });
    });

    return (
      <div className="rtss-databases">
        <SortableTable
          theme="dark"
          columns={this.props.columns}
          rows={rows}
          sortable
          sortOrder={this.props.sortOrder}
          sortColumn={this.props.sortColumn}
          removable
          onColumnHeaderClicked={this.onColumnHeaderClicked.bind(this)}
          onRowDeleteButtonClicked={this.onRowDeleteButtonClicked.bind(this)}
        />
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
