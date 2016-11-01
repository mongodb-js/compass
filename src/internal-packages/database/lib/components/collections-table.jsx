const React = require('react');
const app = require('ampersand-app');
const CollectionsActions = require('../actions/collections-actions');
const SortableTable = app.appRegistry.getComponent('App.SortableTable');
const numeral = require('numeral');

const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:server-stats:databases');

class DatabasesTable extends React.Component {

  onColumnHeaderClicked(column, order) {
    CollectionsActions.sortCollections(column, order);
  }

  onRowDeleteButtonClicked(collName) {
    // CollectionsActions.deleteCollection(collName);
  }

  render() {
    // convert some of the values to human-readable units (MB, GB, ...)
    // we do this here so that sorting is not affected in the store
    //
    //   'Collection Name',
      // 'Num. Documents',
      // 'Avg. Document Size',
      // 'Total Document Size',
      // 'Num. Indexes',
      // 'Total Index Size'

    const rows = _.map(this.props.collections, (coll) => {
      return _.assign({}, coll, {
        'Documents': numeral(coll.Documents).format('0,0'),
        'Avg. Document Size': _.isNaN(coll['Avg. Document Size']) ?
          '-' : numeral(coll['Avg. Document Size']).format('0.0 b'),
        'Total Document Size': numeral(coll['Total Document Size']).format('0.0 b'),
        'Total Index Size': numeral(coll['Total Index Size']).format('0.0 b')
      });
    });

    return (
      <div className="collections-table">
        <SortableTable
          theme="light"
          columns={this.props.columns}
          rows={rows}
          sortable
          sortOrder={this.props.sortOrder}
          sortColumn={this.props.sortColumn}
          removable
          onColumnHeaderClicked={this.onColumnHeaderClicked.bind(this)}
          onRowDeleteButtonClicked={this.onRowDeleteButtonClicked.bind(this)}
        />
      </div>
    );
  }
}

DatabasesTable.propTypes = {
  columns: React.PropTypes.arrayOf(React.PropTypes.string),
  collections: React.PropTypes.arrayOf(React.PropTypes.object),
  sortOrder: React.PropTypes.oneOf(['asc', 'desc']),
  sortColumn: React.PropTypes.string
};

DatabasesTable.displayName = 'DatabasesTable';

module.exports = DatabasesTable;
