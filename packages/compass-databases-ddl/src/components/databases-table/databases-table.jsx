import React, { Component } from 'react';
import PropTypes from 'prop-types';
import numeral from 'numeral';
import assign from 'lodash.assign';
import classnames from 'classnames';
import { SortableTable } from 'hadron-react-components';

import styles from './databases-table.less';

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
    showDatabase: PropTypes.func.isRequired,
    showDropDatabase: PropTypes.func.isRequired
  }

  /**
   * Executed when a column header is clicked.
   *
   * @param {String} column - The column.
   * @param {String} order - The order.
   */
  onHeaderClicked(column, order) {
    this.props.sortDatabases(this.props.databases, column, order);
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
        [NAME]: <a className={classnames(styles['databases-table-link'])} onClick={this.props.showDatabase}>{dbName}</a>,
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
            onColumnHeaderClicked={this.onHeaderClicked.bind(this)}
            onRowDeleteButtonClicked={this.showDropDatabase} />
        </div>
      </div>
    );
  }
}

export default DatabasesTable;
