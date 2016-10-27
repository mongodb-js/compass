const React = require('react');
const FontAwesome = require('react-fontawesome');
const Button = require('react-bootstrap').Button;
const _ = require('lodash');

class SortableTable extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      sortedColumnIndex: 0,
      sortOrder: 'asc'
    };
  }

  componentWillReceiveProps(nextProps) {
    const state = {};
    if (nextProps.sortedColumnIndex !== undefined) {
      state.sortedColumnIndex = nextProps.sortedColumnIndex;
    }
    if (nextProps.sortOrder !== undefined) {
      state.sortOrder = nextProps.sortOrder;
    }
    if (!_.isEmpty(state)) {
      this.setState(state);
    }
  }

  onColumnHeaderClicked(idx, evt) {
    evt.preventDefault();
    let sortOrder = this.state.sortOrder;
    if (this.state.sortedColumnIndex === idx) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      this.setState({sortOrder: sortOrder});
    } else {
      this.setState({sortedColumnIndex: idx});
    }
    if (this.props.onColumnHeaderClicked) {
      this.props.onColumnHeaderClicked(this.props.columns[idx], sortOrder);
    }
  }

  onRowDeleteButtonClicked(idx, evt) {
    evt.preventDefault();
    if (this.props.onRowDeleteButtonClicked) {
      this.props.onRowDeleteButtonClicked(idx);
    }
  }

  renderHeader() {
    const sortClass = `sort-${this.state.sortOrder.toLowerCase()}`;
    const cells = _.map(this.props.columns, (col, idx) => {
      const active = this.state.sortedColumnIndex === idx ? ' sortable-table-th-is-active' : '';
      const sortIcon = this.props.sortable ?
        <FontAwesome className="sortable-table-sort-icon" name={sortClass} fixedWidth /> : null;
      return (
        <th className={`sortable-table-th${active}`} key={`th-${idx}`} onClick={this.onColumnHeaderClicked.bind(this, idx)}>
          {col}
          {sortIcon}
        </th>
      );
    });
    if (this.props.removable) {
      cells.push(<th className="sortable-table-th sortable-table-th-is-last-col"></th>);
    }
    return cells;
  }

  renderRows() {
    return _.map(this.props.rows, (row, r) => {
      // allow both objects and arrays as rows. if object, convert to array
      // in sort order of column names (column names must match exactly).
      if (_.isPlainObject(row)) {
        // turn into array sorted by the column name keys
        row = _.map(this.props.columns, (col) => {
          return _.get(row, col, '');
        });
      }
      if (!_.isArray(row)) {
        row = [];
      }
      if (row.length < this.props.columns.length) {
        // pad the array with empty strings at the end if it's not as long as
        // the columns array
        row = row.concat(_.fill(Array(this.props.columns.length - row.length)));
      } else if (row.length > this.props.columns.length) {
        row = row.slice(0, this.props.columns.length);
      }
      const cells = _.map(row, (cell, c) => {
        return <td className="sortable-table-td" key={`td-${c}`}>{cell}</td>;
      });
      if (this.props.removable) {
        // add a column with a delete button if the `removable` prop was set
        cells.push(
          <td className="sortable-table-td" key="td-delete">
            <Button
              className="sortable-table-trash-button"
              onClick={this.onRowDeleteButtonClicked.bind(this, r)} >
              <FontAwesome className="sortable-table-trash-icon" name="trash-o"/>
            </Button>
          </td>
        );
      }
      return <tr className="sortable-table-tbody-tr" key={`tr-${r}`}>{cells}</tr>;
    });
  }

  render() {
    return (
      <div className={`sortable-table sortable-table-is-${this.props.theme}-theme`}>
        <table className="sortable-table-table">
          <thead>
            <tr className="sortable-table-thead-tr">
              {this.renderHeader()}
            </tr>
          </thead>
          <tbody>
            {this.renderRows()}
          </tbody>
        </table>
      </div>
    );
  }
}

SortableTable.propTypes = {
  theme: React.PropTypes.oneOf(['light', 'dark']),
  columns: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  rows: React.PropTypes.arrayOf(React.PropTypes.oneOfType(
    [React.PropTypes.object, React.PropTypes.array])),
  sortable: React.PropTypes.bool,
  sortedColumnIndex: React.PropTypes.number,
  sortOrder: React.PropTypes.oneOf(['asc', 'desc']),
  removable: React.PropTypes.bool,
  onColumnHeaderClicked: React.PropTypes.func,
  onRowDeleteButtonClicked: React.PropTypes.func
};

SortableTable.defaultProps = {
  theme: 'light',
  rows: [],
  sortable: true,
  removable: false
};

SortableTable.displayName = 'SortableTable';

module.exports = SortableTable;
