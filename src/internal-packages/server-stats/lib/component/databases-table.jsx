const React = require('react');
const app = require('ampersand-app');
const SortableTable = app.appRegistry.getComponent('App.SortableTable');
const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:server-stats:databases');

class DatabasesTable extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      data: [
        {Name: 'Foo', Size: 12455, 'Number of Collections': 14},
        {Name: 'Bar', Size: 30445, 'Number of Collections': 8},
        {Name: 'Baz', Size: 200000, 'Number of Collections': 77},
        {Size: 30445, 'Number of Collections': -4},
        {Name: 'Baz Bar', 'Number of Collections': 43},
        {Name: 'Zab Oof', Size: 34356, 'Number of Collections': 19}
      ]
    };
  }

  onColumnHeaderClicked(column, order) {
    this.setState({data: _.sortByOrder(this.state.data, column, order)});
  }

  onRowDeleteButtonClicked(row) {
    const data = this.state.data.slice();
    data.splice(row, 1);
    this.setState({data: data});
  }

  render() {
    const columns = ['Name', 'Size', 'Number of Collections'];
    return (
      <div className="rtss-databases">
        <SortableTable
          theme="dark"
          columns={columns}
          rows={this.state.data}
          sortable
          removable
          onColumnHeaderClicked={this.onColumnHeaderClicked.bind(this)}
          onRowDeleteButtonClicked={this.onRowDeleteButtonClicked.bind(this)}
        />
      </div>
    );
  }
}

DatabasesTable.propTypes = {
};

DatabasesTable.defaultProps = {
};

DatabasesTable.displayName = 'DatabasesTable';

module.exports = DatabasesTable;
