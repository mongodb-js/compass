import React, { Component } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { sortDatabases } from 'modules/databases';
import Toolbar from 'components/toolbar';
import DatabasesTable from 'components/databases-table';

import styles from './ddl.less';

/**
 * The core DDL component.
 */
class Ddl extends Component {
  static displayName = 'DdlComponent';

  /**
   * Render Ddl component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles.ddl)} data-test-id="databases-table">
        <Toolbar />
        <DatabasesTable
          columns={[]}
          databases={[]}
          isWritable
          isReadonly={false}
          sortOrder="asc"
          sortColumn="Database Name"
          sortDatabases={() => {}}
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
  databases: state.databases
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedDdl = connect(
  mapStateToProps,
  {
    sortDatabases
  },
)(Ddl);

export default MappedDdl;
export { Ddl };
