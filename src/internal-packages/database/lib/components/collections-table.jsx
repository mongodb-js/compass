const React = require('react');
const app = require('ampersand-app');
const CollectionsActions = require('../actions/collections-actions');
const CreateCollectionDialog = require('./create-collection-dialog');
const DropCollectionDialog = require('./drop-collection-dialog');
const TextButton = require('hadron-app-registry').TextButton;
const numeral = require('numeral');

const _ = require('lodash');

class CollectionsTable extends React.Component {

  constructor(props) {
    super(props);
    this.SortableTable = app.appRegistry.getComponent('App.SortableTable');
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

  render() {
    const rows = _.map(this.props.collections, (coll) => {
      return _.assign({}, coll, {
        'Documents': numeral(coll.Documents).format('0,0'),
        'Avg. Document Size': _.isNaN(coll['Avg. Document Size']) ?
          '-' : numeral(coll['Avg. Document Size']).format('0.0 b'),
        'Total Document Size': numeral(coll['Total Document Size']).format('0.0 b'),
        'Total Index Size': numeral(coll['Total Index Size']).format('0.0 b')
      });
    });

    const writable = app.dataService.isWritable();

    return (
      <div className="collections-table">
        <div className="collections-table-create-button action-bar">
          {writable ?
            <TextButton
              text="Create Collection"
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
  sortOrder: React.PropTypes.oneOf(['asc', 'desc']),
  sortColumn: React.PropTypes.string
};

CollectionsTable.displayName = 'CollectionsTable';

module.exports = CollectionsTable;
