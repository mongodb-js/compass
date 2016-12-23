const React = require('react');
const app = require('ampersand-app');
const CollectionsActions = require('../actions/collections-actions');
const CreateCollectionDialog = require('./create-collection-dialog');
const DropCollectionDialog = require('./drop-collection-dialog');
const { TextButton } = require('hadron-react-buttons');
const numeral = require('numeral');
const ipc = require('hadron-ipc');
const toNS = require('mongodb-ns');

// const debug = require('debug')('mongodb-compass:database:collections-table');

const _ = require('lodash');

class CollectionsTable extends React.Component {

  constructor(props) {
    super(props);
    this.SortableTable = app.appRegistry.getComponent('App.SortableTable');
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
  }

  onColumnHeaderClicked(column, order) {
    CollectionsActions.sortCollections(column, order);
  }

  onRowDeleteButtonClicked(index, collection) {
    CollectionsActions.openDropCollectionDialog(collection);
  }

  onCreateCollectionButtonClicked() {
    CollectionsActions.openCreateCollectionDialog();
  }

  onNameClicked(name) {
    // retrieve collection based on name
    const collection = _.first(_.filter(this.props.collections, '_id', `${this.props.database}.${name}`));
    this.CollectionStore.setCollection(collection);
    ipc.call('window:show-collection-submenu');
  }

  renderLinkOrCollName(coll) {
    const collName = coll['Collection Name'];
    const ns = toNS(`${this.props.database}.${collName}`);
    if (ns.system) {
      return collName;
    }
    return (
      <a className="collections-table-link" href="#" onClick={this.onNameClicked.bind(this, collName)}>{collName}</a>
    );
  }

  render() {
    const rows = _.map(this.props.renderedCollections, (coll) => {
      return _.assign({}, coll, {
        'Collection Name': this.renderLinkOrCollName(coll),
        'Documents': numeral(coll.Documents).format('0,0'),
        'Avg. Document Size': _.isNaN(coll['Avg. Document Size']) ?
          '-' : numeral(coll['Avg. Document Size']).format('0.0 b'),
        'Total Document Size': numeral(coll['Total Document Size']).format('0.0 b'),
        'Total Index Size': numeral(coll['Total Index Size']).format('0.0 b')
      });
    });

    const writable = app.dataService.isWritable();

    return (
      <div className="collections-table" data-test-id="collections-table">
        <div className="collections-table-create-button action-bar">
          {writable ?
            <TextButton
              text="Create Collection"
              dataTestId="open-create-collection-modal-button"
              className="btn btn-primary btn-xs"
              clickHandler={this.onCreateCollectionButtonClicked.bind(this)} /> : null}
        </div>
        <this.SortableTable
          theme="light"
          columns={this.props.columns}
          rows={rows}
          sortable
          sortOrder={this.props.sortOrder}
          sortColumn={this.props.sortColumn}
          valueIndex={0}
          removable={writable}
          onColumnHeaderClicked={this.onColumnHeaderClicked.bind(this)}
          clickable={false}
          onRowDeleteButtonClicked={this.onRowDeleteButtonClicked.bind(this)}
        />
        <CreateCollectionDialog />
        <DropCollectionDialog />
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
