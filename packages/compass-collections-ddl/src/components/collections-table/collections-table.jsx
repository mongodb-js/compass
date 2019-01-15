import React, { PureComponent } from 'react';
import { Provider } from 'react-redux';
import PropTypes from 'prop-types';
import numeral from 'numeral';
import assign from 'lodash.assign';
import classnames from 'classnames';
import { SortableTable } from 'hadron-react-components';
import DropCollectionModal from 'components/drop-collection-modal';
import dropCollectionStore from 'stores/drop-collection';

import styles from './collections-table.less';

/**
 * The name constant.
 */
const NAME = 'Collection Name';

/**
 * The storage size.
 */
const STORAGE = 'Storage Size';

/**
 * The collections table component.
 */
class CollectionsTable extends PureComponent {
  static displayName = 'CollectionsTableComponent';

  static propTypes = {
    columns: PropTypes.array.isRequired,
    collections: PropTypes.array.isRequired,
    isWritable: PropTypes.bool.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    changeCollectionName: PropTypes.func.isRequired,
    reset: PropTypes.func.isRequired,
    sortOrder: PropTypes.string.isRequired,
    sortColumn: PropTypes.string.isRequired,
    sortCollections: PropTypes.func.isRequired,
    showCollection: PropTypes.func.isRequired,
    toggleIsVisible: PropTypes.func.isRequired
  }

  /**
   * Executed when a column header is clicked.
   *
   * @param {String} column - The column.
   * @param {String} order - The order.
   */
  onHeaderClicked = (column, order) => {
    this.props.sortCollections(this.props.collections, column, order);
  }

  /**
   * Happens on the click of the delete trash can in the list.
   *
   * @param {Number} index - The index in the list.
   * @param {String} name - The db name.
   */
  onDeleteClicked = (index, name) => {
    dropCollectionStore.dispatch(this.props.reset());
    dropCollectionStore.dispatch(this.props.changeCollectionName(name));
    dropCollectionStore.dispatch(this.props.toggleIsVisible(true));
  }

  /**
   * Use clicked on the db name link.
   *
   * @param {String} name - The db name.
   */
  onNameClicked(name) {
    this.props.showCollection(name);
  }

  /**
   * Render Collections Table component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const rows = this.props.collections.map((db) => {
      const dbName = db[NAME];
      return assign({}, db, {
        [NAME]: <a className={classnames(styles['collections-table-link'])} onClick={this.onNameClicked.bind(this, dbName)}>{dbName}</a>,
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
            onColumnHeaderClicked={this.onHeaderClicked}
            onRowDeleteButtonClicked={this.onDeleteClicked} />
        </div>
        <Provider store={dropCollectionStore}>
          <DropCollectionModal />
        </Provider>
      </div>
    );
  }
}

export default CollectionsTable;
