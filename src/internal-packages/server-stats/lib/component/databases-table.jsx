const React = require('react');
const app = require('ampersand-app');
const SortableTable = app.appRegistry.getComponent('App.SortableTable');
// const FontAwesome = require('react-fontawesome');
// const Button = require('react-bootstrap').Button;
const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:server-stats:databases');

class DatabasesTable extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      data: [
        // {Name: 'Foo', 'Size': <Button bsSize="small" bsStyle="danger">Danger Zone</Button>, 'Number of Collections': 14},
        // {Name: 'Bar', 'Size': <FontAwesome size="3x" name="thumbs-o-up" />, 'Number of Collections': 8}
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
    const columns = ['Name', 'Database Size', 'Number of Collections'];
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
