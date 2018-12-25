import React, { Component } from 'react';
import PropTypes from 'prop-types';
import numeral from 'numeral';
import assign from 'lodash.assign';
import { SortableTable } from 'hadron-react-components';

/**
 * The name constant.
 */
const NAME = 'Database Name';

/**
 * The storage size.
 */
const STORAGE = 'Storage Size';

/**
 * The databases table component.
 */
class DatabasesTable extends Component {
  static displayName = 'DatabasesTableComponent';

  static propTypes = {
    columns: PropTypes.array.isRequired,
    databases: PropTypes.array.isRequired,
    isWritable: PropTypes.bool.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    sortOrder: PropTypes.string.isRequired,
    sortColumn: PropTypes.string.isRequired,
    sortDatabases: PropTypes.func.isRequired,
    showDropDatabase: PropTypes.func.isRequired
  }

  /**
   * Render Databases Table component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const rows = this.props.databases.map((db) => {
      const dbName = db[NAME];
      return assign({}, db, {
        [NAME]: <a className="rtss-databases-link" onClick={this.onNameClicked.bind(this, dbName)}>{dbName}</a>,
        [STORAGE]: numeral(db[STORAGE]).format('0.0b')
      });
    });

    return (
      <div className="column-container">
        <div className="column main">
          <SortableTable
            theme="light"
            columns={this.props.columns}
            rows={rows}
            sortable
            sortOrder={this.props.sortOrder}
            sortColumn={this.props.sortColumn}
            valueIndex={0}
            removable={this.props.isWritable && !this.props.isReadonly}
            onColumnHeaderClicked={this.props.sortDatabases}
            onRowDeleteButtonClicked={this.showDropDatabase} />
        </div>
      </div>
    );
  }
}

export default DatabasesTable;
