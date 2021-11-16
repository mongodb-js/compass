import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import numeral from 'numeral';
import isNaN from 'lodash.isnan';
import { SortableTable } from 'hadron-react-components';

import dropCollectionStore from '../../../stores/drop-collection';
import styles from './collections-table.module.less';
import CollectionProperties from './collection-properties';
import {
  TIME_SERIES_COLLECTION_TYPE,
  VIEW_COLLECTION_TYPE
} from '../../../modules/collections/collections';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { track } = createLoggerAndTelemetry('COMPASS-COLLECTIONS-UI');

/**
 * The name constant.
 */
const NAME = 'Collection Name';

/**
 * Doc constant.
 */
const DOCUMENTS = 'Documents';

/**
 * Avg doc size constant.
 */
const AVG_DOC_SIZE = 'Avg. Document Size';

/**
 * Total doc size constant.
 */
const TOT_DOC_SIZE = 'Total Document Size';

/**
 * Num indexes constant.
 */
const NUM_INDEX = 'Num. Indexes';

/**
 * Total index size constant.
 */
const TOT_INDEX_SIZE = 'Total Index Size';

/**
 * Properties constant.
 */
const PROPS = 'Properties';

/**
 * Dash constant.
 */
const DASH = '-';
class CollectionsTable extends PureComponent {
  static displayName = 'CollectionsTableComponent';

  static propTypes = {
    columns: PropTypes.array.isRequired,
    collections: PropTypes.array.isRequired,
    isWritable: PropTypes.bool.isRequired,
    openLink: PropTypes.func.isRequired,
    open: PropTypes.func.isRequired,
    databaseName: PropTypes.string,
    sortOrder: PropTypes.string.isRequired,
    sortColumn: PropTypes.string.isRequired,
    sortCollections: PropTypes.func.isRequired,
    showCollection: PropTypes.func.isRequired
  }

  componentDidMount() {
    track('Screen', { name: 'collections' });
  }

  /**
   * Executed when a column header is clicked.
   *
   * @param {String} column - The column.
   * @param {String} order - The order.
   */
  onHeaderClicked = (column, order) => {
    this.props.sortCollections(column, order);
  }

  /**
   * Happens on the click of the delete trash can in the list.
   *
   * @param {Number} index - The index in the list.
   * @param {String} name - The collection name.
   */
  onDeleteClicked = (index, name) => {
    dropCollectionStore.dispatch(this.props.open(name, this.props.databaseName));
  }

  /**
   * Use clicked on the db name link.
   *
   * @param {String} name - The db name.
   */
  onNameClicked(name) {
    this.props.showCollection(name);
  }

  shouldDisplayRemoveButton() {
    return this.props.isWritable && process.env.HADRON_READONLY !== 'true';
  }

  /**
   * Render the collection link.
   *
   * @param {Object} coll - The collection object.
   *
   * @returns {Component} The component.
   */
  renderLink(coll) {
    const collName = coll[NAME];
    let viewInfo = null;

    if (coll.type === 'view' && coll.view_on) {
      viewInfo = <span className={styles['collections-table-view-on']}>(view on: {coll.view_on})</span>;
    }

    return (
      <div>
        <a
          className={styles['collections-table-link']}
          data-test-id={`collections-table-link-${collName}`}
          onClick={this.onNameClicked.bind(this, collName)}>
          {collName}
        </a>
        {viewInfo}
      </div>
    );
  }

  /**
   * Render Collections Table component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const rows = this.props.collections.map((coll) => {
      const linkName = this.renderLink(coll);
      return Object.assign({}, coll, {
        [NAME]: linkName,
        [DOCUMENTS]: (
          coll.type === TIME_SERIES_COLLECTION_TYPE ||
          coll.type === VIEW_COLLECTION_TYPE ||
          isNaN(coll.Documents)
        ) ? DASH : numeral(coll.Documents).format('0,0'),
        [AVG_DOC_SIZE]: isNaN(coll[AVG_DOC_SIZE]) ?
          DASH : numeral(coll[AVG_DOC_SIZE]).format('0.0 b'),
        [TOT_DOC_SIZE]: isNaN(coll[TOT_DOC_SIZE]) ?
          DASH : numeral(coll[TOT_DOC_SIZE]).format('0.0 b'),
        [NUM_INDEX]: isNaN(coll[NUM_INDEX]) ? DASH : coll[NUM_INDEX],
        [TOT_INDEX_SIZE]: isNaN(coll[TOT_INDEX_SIZE]) ?
          DASH : numeral(coll[TOT_INDEX_SIZE]).format('0.0 b'),
        [PROPS]: <CollectionProperties collection={coll} />
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
            removable={this.shouldDisplayRemoveButton()}
            onColumnHeaderClicked={this.onHeaderClicked}
            onRowDeleteButtonClicked={this.onDeleteClicked} />
        </div>
      </div>
    );
  }
}

export default CollectionsTable;
