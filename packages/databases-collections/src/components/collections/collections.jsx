import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import CollectionsToolbar from './collections-toolbar';
import CollectionsTable from './collections-table';
import { sortCollections } from '../../modules/collections/collections';
import { openLink } from '../../modules/link';
import { showCollection } from '../../modules/show-collection';
import { open as openCreate } from '../../modules/create-collection';
import { open as openDrop } from '../../modules/drop-collection';

import styles from './collections.less';

class Collections extends PureComponent {
  static displayName = 'CollectionsComponent';

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
    sortCollections: PropTypes.func.isRequired,
    isDataLake: PropTypes.bool.isRequired,
    updateNamespace: PropTypes.func.isRequired
  }

  /**
   * Render Collections component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={styles.collections} data-test-id="collections-table">
        <CollectionsToolbar
          isReadonly={this.props.isReadonly}
          databaseName={this.props.databaseName}
          open={openCreate}
          isDataLake={this.props.isDataLake}
        />
        <CollectionsTable
          columns={this.props.columns}
          collections={this.props.collections}
          isWritable={this.props.isWritable}
          isReadonly={this.props.isReadonly}
          databaseName={this.props.databaseName}
          openLink={this.props.openLink}
          showCollection={this.props.showCollection}
          sortOrder={this.props.sortOrder}
          sortColumn={this.props.sortColumn}
          sortCollections={this.props.sortCollections}
          updateNamespace={this.props.updateNamespace}
          open={openDrop}
        />
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
  isReadonly: state.isReadonly,
  isWritable: state.isWritable,
  sortColumn: state.sortColumn,
  sortOrder: state.sortOrder,
  isDataLake: state.isDataLake
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const ConnectedCollections = connect(
  mapStateToProps,
  {
    showCollection,
    sortCollections,
    openLink
  },
)(Collections);

export default ConnectedCollections;
export { Collections };
