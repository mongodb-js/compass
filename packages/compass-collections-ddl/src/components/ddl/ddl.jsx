import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classnames from 'classnames';
import Toolbar from 'components/toolbar';
import CollectionsTable from 'components/collections-table';
import { showCollection } from 'modules/show-collection';
import { sortCollections } from 'modules/collections';
import { toggleIsVisible } from 'modules/is-visible';
import { reset } from 'modules/reset';
import { changeCollectionName } from 'modules/drop-collection/name';

import styles from './ddl.less';

/**
 * The core DDL component.
 */
class Ddl extends PureComponent {
  static displayName = 'DdlComponent';

  static propTypes = {
    columns: PropTypes.array.isRequired,
    collections: PropTypes.array.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    isWritable: PropTypes.bool.isRequired,
    changeCollectionName: PropTypes.func.isRequired,
    reset: PropTypes.func.isRequired,
    showCollection: PropTypes.func.isRequired,
    sortColumn: PropTypes.string.isRequired,
    sortOrder: PropTypes.string.isRequired,
    sortCollections: PropTypes.func.isRequired,
    toggleIsVisible: PropTypes.func.isRequired
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
          toggleIsVisible={this.props.toggleIsVisible}
          reset={this.props.reset} />
        <CollectionsTable
          columns={this.props.columns}
          collections={this.props.collections}
          isWritable={this.props.isWritable}
          isReadonly={this.props.isReadonly}
          changeCollectionName={this.props.changeCollectionName}
          reset={this.props.reset}
          sortOrder={this.props.sortOrder}
          sortColumn={this.props.sortColumn}
          sortCollections={this.props.sortCollections}
          showCollection={this.props.showCollection}
          toggleIsVisible={this.props.toggleIsVisible} />
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
  sortOrder: state.sortOrder
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedDdl = connect(
  mapStateToProps,
  {
    changeCollectionName,
    reset,
    showCollection,
    sortCollections,
    toggleIsVisible
  },
)(Ddl);

export default MappedDdl;
export { Ddl };
