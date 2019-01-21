import React, { PureComponent } from 'react';
import { Provider } from 'react-redux';
import ReactTooltip from 'react-tooltip';
import PropTypes from 'prop-types';
import numeral from 'numeral';
import assign from 'lodash.assign';
import isEmpty from 'lodash.isempty';
import isNaN from 'lodash.isnan';
import classnames from 'classnames';
import { SortableTable, InfoSprinkle } from 'hadron-react-components';
import DropCollectionModal from 'components/drop-collection-modal';
import dropCollectionStore from 'stores/drop-collection';

import styles from './collections-table.less';

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

/**
 * Tooltip ID constant.
 */
const TOOLTIP_ID = 'collation-property';

/**
 * The help URL for collation.
 */
const HELP_URL_COLLATION = 'https://docs.mongodb.com/master/reference/collation/';

/**
 * Collation option mappings.
 */
const COLLATION_OPTIONS = {
  locale: 'Locale',
  caseLevel: 'Case Level',
  caseFirst: 'Case First',
  strength: 'Strength',
  numericOrdering: 'Numeric Ordering',
  alternate: 'Alternate',
  maxVariable: 'MaxVariable',
  normalization: 'Normalization',
  backwards: 'Backwards',
  version: 'Version'
};

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
    openLink: PropTypes.func.isRequired,
    open: PropTypes.func.isRequired,
    databaseName: PropTypes.string,
    sortOrder: PropTypes.string.isRequired,
    sortColumn: PropTypes.string.isRequired,
    sortCollections: PropTypes.func.isRequired,
    showCollection: PropTypes.func.isRequired
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

  /**
   * Render the collation properties.
   *
   * @param {Object} properties - The properties.
   *
   * @returns {Object} The mapped properties.
   */
  renderCollationOptions(properties) {
    let collation = '';
    Object.keys(properties).forEach((key) => {
      if (collation !== '') {
        collation = `${collation}<br />`;
      }
      collation = `${collation}${COLLATION_OPTIONS[key]}: ${properties[key]}`;
    });
    return collation;
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
    return (
      <a
        className={classnames(styles['collections-table-link'])}
        onClick={this.onNameClicked.bind(this, collName)}>
        {collName}
      </a>
    );
  }

  /**
   * Render the collation properties.
   *
   * @param {Object} properties - The properties.
   *
   * @returns {Component} The component.
   */
  renderProperty(properties) {
    if (!isEmpty(properties)) {
      const tooltipOptions = {
        'data-tip': this.renderCollationOptions(properties),
        'data-for': TOOLTIP_ID,
        'data-effect': 'solid',
        'data-border': true
      };
      return (
        <div {...tooltipOptions} className={classnames(styles['collections-table-property'])}>
          <span className={classnames(styles['collections-table-tooltip'])}>Collation</span>
          <ReactTooltip id={TOOLTIP_ID} html />
          <InfoSprinkle helpLink={HELP_URL_COLLATION} onClickHandler={this.props.openLink} />
        </div>
      );
    }
  }

  /**
   * Render Collections Table component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const rows = this.props.collections.map((coll) => {
      const linkName = this.renderLink(coll);

      return assign({}, coll, {
        [NAME]: linkName,
        [DOCUMENTS]: isNaN(coll.Documents) ? DASH : numeral(coll.Documents).format('0,0'),
        [AVG_DOC_SIZE]: isNaN(coll[AVG_DOC_SIZE]) ?
          DASH : numeral(coll[AVG_DOC_SIZE]).format('0.0 b'),
        [TOT_DOC_SIZE]: isNaN(coll[TOT_DOC_SIZE]) ?
          DASH : numeral(coll[TOT_DOC_SIZE]).format('0.0 b'),
        [NUM_INDEX]: isNaN(coll[NUM_INDEX]) ? DASH : coll[NUM_INDEX],
        [TOT_INDEX_SIZE]: isNaN(coll[TOT_INDEX_SIZE]) ?
          DASH : numeral(coll[TOT_INDEX_SIZE]).format('0.0 b'),
        [PROPS]: this.renderProperty(coll.Properties)
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
