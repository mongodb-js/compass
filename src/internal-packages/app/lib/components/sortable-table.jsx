const React = require('react');
const FontAwesome = require('react-fontawesome');
const _ = require('lodash');

class SortableTable extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      sortedColumnIndex: 0,
      sortOrder: 'ASC'
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
    let sortOrder = this.state.sortOrder;
    evt.preventDefault();
    if (this.state.sortedColumnIndex === idx) {
      sortOrder = sortOrder === 'ASC' ? 'DESC' : 'ASC';
      this.setState({sortOrder: sortOrder});
    } else {
      this.setState({sortedColumnIndex: idx});
    }
    if (this.props.onColumnHeaderClicked) {
      this.props.onColumnHeaderClicked(idx, sortOrder);
    }
  }

  renderHeader() {
    const sortClass = `sort-${this.state.sortOrder.toLowerCase()}`;

    return _.map(this.props.columns, (col, idx) => {
      const active = this.state.sortedColumnIndex === idx ? 'active' : null;
      const sortIcon = this.props.sortable ?
        <FontAwesome className="sort" name={sortClass} fixedWidth /> : null;
      return (
        <th className={active} key={`th-${idx}`} onClick={this.onColumnHeaderClicked.bind(this, idx)}>
          {col}
          {sortIcon}
        </th>
      );
    });
  }

  render() {
    return (
      <div className="sortable-table">
        <table>
          <thead>
            <tr>
              {this.renderHeader()}
            </tr>
          </thead>
          <tbody>
          </tbody>
        </table>
      </div>
    );
  }
}

SortableTable.propTypes = {
  columns: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  rows: React.PropTypes.arrayOf(React.PropTypes.oneOf(
    [React.PropTypes.object, React.PropTypes.array])),
  sortable: React.PropTypes.bool,
  sortedColumnIndex: React.PropTypes.number,
  sortOrder: React.PropTypes.oneOf(['ASC', 'DESC']),
  removable: React.PropTypes.bool,
  onColumnHeaderClicked: React.PropTypes.func,
  onRowDeleteButtonClicked: React.PropTypes.func
};

SortableTable.defaultProps = {
  rows: [],
  sortable: true,
  sortedColumnIndex: 0,
  sortOrder: 'ASC',
  removable: false
};

SortableTable.displayName = 'SortableTable';

module.exports = SortableTable;
