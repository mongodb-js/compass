const React = require('react');
const app = require('hadron-app');
const CollectionsActions = require('../actions/collections-actions');
const numeral = require('numeral');
const ipc = require('hadron-ipc');
const { SortableTable } = require('hadron-react-components');
const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:database:collections-table');

class CollectionsTable extends React.Component {

  constructor(props) {
    super(props);
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
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

  renderLink(coll) {
    const collName = coll['Collection Name'];
    return (
      <a className="collections-table-link" href="#" onClick={this.onNameClicked.bind(this, collName)}>{collName}</a>
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
          '-' : numeral(coll['Total Index Size']).format('0.0 b')
      });
    });

    const isWritable = app.dataService.isWritable();
    const tooltipText = 'This action is not available on a secondary node.';

    return (
      <div className="collections-table" data-test-id="collections-table">
        <div className="collections-table-create-button action-bar controls-container">
          <div className="tooltip-button-wrapper" data-tip={tooltipText} data-for="is-not-writable">
            <button
                className="btn btn-primary btn-xs"
                type="button"
                data-test-id="open-create-collection-modal-button"
                disabled={!isWritable}
                onClick={this.onCreateCollectionButtonClicked.bind(this)}>
              Create Collection
            </button>
          </div>
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
              removable={isWritable}
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
  columns: React.PropTypes.arrayOf(React.PropTypes.string),
  collections: React.PropTypes.arrayOf(React.PropTypes.object),
  renderedCollections: React.PropTypes.arrayOf(React.PropTypes.object),
  database: React.PropTypes.string,
  sortOrder: React.PropTypes.oneOf(['asc', 'desc']),
  sortColumn: React.PropTypes.string
};

CollectionsTable.displayName = 'CollectionsTable';

module.exports = CollectionsTable;
