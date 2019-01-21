import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classnames from 'classnames';
import Toolbar from 'components/toolbar';
import CollectionsTable from 'components/collections-table';
import { showCollection } from 'modules/show-collection';
import { sortCollections } from 'modules/collections';
import { openLink } from 'modules/link';
import { open as openCreate } from 'modules/create-collection';
import { open as openDrop } from 'modules/drop-collection';

import styles from './ddl.less';

/**
 * The core DDL component.
 */
class Ddl extends PureComponent {
  static displayName = 'DdlComponent';

  static propTypes = {
    columns: PropTypes.array.isRequired,
    collections: PropTypes.array.isRequired,
    databaseName: PropTypes.string,
    isReadonly: PropTypes.bool.isRequired,
    isWritable: PropTypes.bool.isRequired,
    openLink: PropTypes.func.isRequired,
    showCollection: PropTypes.func.isRequired,
    sortColumn: PropTypes.string.isRequired,
    sortOrder: PropTypes.string.isRequired,
    sortCollections: PropTypes.func.isRequired
  }

  /**
   * Render Ddl component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles.ddl)} data-test-id="collections-table">
        <Toolbar
          isReadonly={this.props.isReadonly}
          databaseName={this.props.databaseName}
          open={openCreate} />
        <CollectionsTable
          columns={this.props.columns}
          collections={this.props.collections}
          isWritable={this.props.isWritable}
          isReadonly={this.props.isReadonly}
          databaseName={this.props.databaseName}
          openLink={this.props.openLink}
          sortOrder={this.props.sortOrder}
          sortColumn={this.props.sortColumn}
          sortCollections={this.props.sortCollections}
          showCollection={this.props.showCollection}
          open={openDrop} />
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
  collections: state.collections,
  databaseName: state.databaseName,
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
    showCollection,
    sortCollections,
    openLink
  },
)(Ddl);

export default MappedDdl;
export { Ddl };
