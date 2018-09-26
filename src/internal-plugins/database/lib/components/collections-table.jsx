const React = require('react');
const PropTypes = require('prop-types');
const CollectionsActions = require('../actions/collections-actions');
const numeral = require('numeral');
const ipc = require('hadron-ipc');
const { SortableTable, InfoSprinkle } = require('hadron-react-components');
const _ = require('lodash');
const { shell } = require('electron');
const ReactTooltip = require('react-tooltip');

const TOOLTIP_ID = 'collation-property';
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
 * The help URL for collation.
 */
const HELP_URL_COLLATION = 'https://docs.mongodb.com/master/reference/collation/';

// const debug = require('debug')('mongodb-compass:database:collections-table');

class CollectionsTable extends React.Component {

  constructor(props) {
    super(props);
    const appRegistry = global.hadronApp.appRegistry;
    this.CollectionStore = appRegistry.getStore('App.CollectionStore');
    this.TextWriteButton = appRegistry.getComponent('DeploymentAwareness.TextWriteButton');
    this.WriteStateStore = appRegistry.getStore('DeploymentAwareness.WriteStateStore');
    this.state = this.WriteStateStore.state;
  }

  componentDidMount() {
    this.unsubscribeStateStore = this.WriteStateStore.listen(this.deploymentStateChanged.bind(this));
  }

  componentWillUnmount() {
    this.unsubscribeStateStore();
  }

  onColumnHeaderClicked(column, order) {
    CollectionsActions.sortCollections(column, order);
  }

  onRowDeleteButtonClicked(index, collection) {
    CollectionsActions.openDropCollectionDialog(this.props.database, collection);
  }

  onCreateCollectionButtonClicked() {
    const databaseName = this.props.database;
    CollectionsActions.openCreateCollectionDialog(databaseName);
  }

  onNameClicked(name) {
    // retrieve collection based on name
    const collection = _.first(_.filter(this.props.collections, '_id', `${this.props.database}.${name}`));
    this.CollectionStore.setCollection(collection);
    ipc.call('window:show-collection-submenu');
  }

  /**
   * Called when the deployment state changes.
   *
   * @param {Object} state - The deployment state.
   */
  deploymentStateChanged(state) {
    this.setState(state);
  }

  isReadonlyDistro() {
    return process.env.HADRON_READONLY === 'true';
  }

  renderLink(coll) {
    const collName = coll['Collection Name'];
    return (
      <a className="collections-table-link" href="#" onClick={this.onNameClicked.bind(this, collName)}>{collName}</a>
    );
  }

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

  renderButton() {
    if (!this.isReadonlyDistro()) {
      return (
        <this.TextWriteButton
          className="btn btn-primary btn-xs"
          dataTestId="open-create-collection-modal-button"
          text="Create Collection"
          tooltipId="database-is-not-writable"
          clickHandler={this.onCreateCollectionButtonClicked.bind(this)} />
      );
    }
  }

  renderProperty(properties) {
    const tooltipOptions = {
      'data-tip': this.renderCollationOptions(properties),
      'data-for': TOOLTIP_ID,
      'data-effect': 'solid',
      'data-border': true
    };
    return (
      <div {...tooltipOptions} className="property">
        <span className="collationTooltip">Collation</span>
        <ReactTooltip id={TOOLTIP_ID} html />
        <InfoSprinkle
          helpLink={HELP_URL_COLLATION}
          onClickHandler={shell.openExternal}
        />
      </div>
    );
  }

  render() {
    const rows = _.map(this.props.renderedCollections, (coll) => {
      const linkName = this.renderLink(coll);

      // return formatted table row
      return _.assign({}, coll, {
        'Collection Name': linkName,
        'Documents': isNaN(coll.Documents) ? '-' : numeral(coll.Documents).format('0,0'),
        'Avg. Document Size': _.isNaN(coll['Avg. Document Size']) ?
          '-' : numeral(coll['Avg. Document Size']).format('0.0 b'),
        'Total Document Size': isNaN(coll['Total Document Size']) ?
          '-' : numeral(coll['Total Document Size']).format('0.0 b'),
        'Num. Indexes': isNaN(coll['Num. Indexes']) ? '-' : coll['Num. Indexes'],
        'Total Index Size': isNaN(coll['Total Index Size']) ?
          '-' : numeral(coll['Total Index Size']).format('0.0 b'),
        'Properties': this.renderProperty(coll.Properties)
      });
    });

    return (
      <div className="collections-table" data-test-id="collections-table">
        <div className="collections-table-create-button action-bar controls-container">
          {this.renderButton()}
        </div>
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
              removable={this.state.isWritable && !this.isReadonlyDistro()}
              onColumnHeaderClicked={this.onColumnHeaderClicked.bind(this)}
              onRowDeleteButtonClicked={this.onRowDeleteButtonClicked.bind(this)}
            />
          </div>
        </div>
      </div>
    );
  }
}

CollectionsTable.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.string),
  collections: PropTypes.arrayOf(PropTypes.object),
  renderedCollections: PropTypes.arrayOf(PropTypes.object),
  database: PropTypes.string,
  sortOrder: PropTypes.oneOf(['asc', 'desc']),
  sortColumn: PropTypes.string
};

CollectionsTable.displayName = 'CollectionsTable';

module.exports = CollectionsTable;
