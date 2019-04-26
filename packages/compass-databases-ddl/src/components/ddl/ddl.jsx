import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { ZeroState } from 'hadron-react-components';
import Toolbar from 'components/toolbar';
import DatabasesTable from 'components/databases-table';
import { showDatabase } from 'modules/show-database';
import { sortDatabases } from 'modules/databases';
import { open as openCreate } from 'modules/create-database';
import { open as openDrop } from 'modules/drop-database';

import styles from './ddl.less';

const HEADER = 'Unable to display databases and collections';
const SUBTEXT = 'This server or service appears to be emulating'
  + ' MongoDB. Some documented MongoDB features may work differently, may be'
  + ' entirely missing or incomplete, or may have unexpectedly different'
  + ' performance characteristics than would be found when connecting to a'
  + ' real MongoDB server or service.';
const DOCUMENTATION_LINK = 'https://www.mongodb.com/cloud/atlas';

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
    showDatabase: PropTypes.func.isRequired,
    sortColumn: PropTypes.string.isRequired,
    sortOrder: PropTypes.string.isRequired,
    sortDatabases: PropTypes.func.isRequired,
    isGenuineMongoDB: PropTypes.bool.isRequired
  }

  renderDatabases() {
    if (!this.props.isGenuineMongoDB && this.props.databases.length === 0) {
      return (
        <div className="column-container">
          <div className="column main">
            <div className={classnames(styles['ddl-non-genuine-warning'])}>
              <div className="zero-graphic zero-graphic-non-genuine-mongodb"></div>
              <ZeroState
                header={HEADER}
                subtext={SUBTEXT}>
                <a className="zero-state-link" href={DOCUMENTATION_LINK}>
                  Try MongoDB Atlas
                </a>
              </ZeroState>
            </div>
          </div>
        </div>
      );
    }
    return (
      <DatabasesTable
        columns={this.props.columns}
        databases={this.props.databases}
        isWritable={this.props.isWritable}
        isReadonly={this.props.isReadonly}
        sortOrder={this.props.sortOrder}
        sortColumn={this.props.sortColumn}
        sortDatabases={this.props.sortDatabases}
        showDatabase={this.props.showDatabase}
        open={openDrop} />
    );
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
          open={openCreate} />
        {this.renderDatabases()}
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
  sortOrder: state.sortOrder,
  isGenuineMongoDB: state.isGenuineMongoDB
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedDdl = connect(
  mapStateToProps,
  {
    showDatabase,
    sortDatabases
  },
)(Ddl);

export default MappedDdl;
export { Ddl };
