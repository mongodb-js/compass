import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { sortDatabases } from 'modules/databases';
import { showCreateDatabase } from 'modules/create-database/is-visible';
import Toolbar from 'components/toolbar';
import DatabasesTable from 'components/databases-table';

import styles from './ddl.less';

/**
 * The core DDL component.
 */
class Ddl extends PureComponent {
  static displayName = 'DdlComponent';

  static propTypes = {
    columns: PropTypes.array.isRequired,
    databases: PropTypes.array.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    isWritable: PropTypes.bool.isRequired,
    sortColumn: PropTypes.string.isRequired,
    sortOrder: PropTypes.string.isRequired,
    sortDatabases: PropTypes.func.isRequired,
    showCreateDatabase: PropTypes.func.isRequired
  }

  /**
   * Render Ddl component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles.ddl)} data-test-id="databases-table">
        <Toolbar
          isReadonly={this.props.isReadonly}
          showCreateDatabase={this.props.showCreateDatabase} />
        <DatabasesTable
          columns={this.props.columns}
          databases={this.props.databases}
          isWritable={this.props.isWritable}
          isReadonly={this.props.isReadonly}
          sortOrder={this.props.sortOrder}
          sortColumn={this.props.sortColumn}
          sortDatabases={this.props.sortDatabases}
          showDatabase={() => {}}
          showDropDatabase={() => {}} />
      </div>
    );
  }
}

/**
 * Map the store state to properties to pass to the components.
 *
 * @param {Object} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state) => ({
  columns: state.columns,
  databases: state.databases,
  isReadonly: state.isReadonly,
  isWritable: state.isWritable,
  sortColumn: state.sortColumn,
  sortOrder: state.sortOrder
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedDdl = connect(
  mapStateToProps,
  {
    sortDatabases,
    showCreateDatabase
  },
)(Ddl);

export default MappedDdl;
export { Ddl };
