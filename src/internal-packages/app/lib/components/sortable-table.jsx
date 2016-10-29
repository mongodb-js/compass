const React = require('react');
const FontAwesome = require('react-fontawesome');
const Button = require('react-bootstrap').Button;
const _ = require('lodash');

class SortableTable extends React.Component {

  onColumnHeaderClicked(idx, evt) {
    evt.preventDefault();
    let sortOrder = this.props.sortOrder;
    if (this._sortColumnMatch(idx, this.props.sortColumn)) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
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

  /**
   * compares either a column index (number) or a column name (string) with
   * another column name and returns whether they are a match. This abstraction
   * allows the user to enter either an index or column name for the
   * `sortColumn` prop.
   *
   * @param {Number|String} idxOrName    column index or name to compare with
   * @param {String} column              column name
   *
   * @return {Boolean}                   whether or not they are a match
   */
  _sortColumnMatch(idxOrName, column) {
    if (_.isNumber(idxOrName)) {
      return this.props.columns[idxOrName] === column;
    }
    return idxOrName === column;
  }

  renderHeader() {
    const sortClass = `sort-${this.props.sortOrder.toLowerCase()}`;
    const cells = _.map(this.props.columns, (col, idx) => {
      const active = this._sortColumnMatch(this.props.sortColumn, col) ? ' sortable-table-th-is-active' : '';
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
      cells.push(<th key="th-delete" className="sortable-table-th sortable-table-th-is-last-col"></th>);
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
  /**
   * the style theme, matching our dark or light pages.
   * @type {String}   one of `light` (default) or `dark`
   */
  theme: React.PropTypes.oneOf(['light', 'dark']),
  /**
   * specify column names (required)
   * @type {Array}  of column names (strings).
   */
  columns: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  /**
   * specify data for table rows. Can be an array of objects (keys must
   * match column names exactly), or an array of arrays. Columns not found in
   * the object are left blank. Inner arrays are padded (if too short) or
   * cropped (if too long).
   * @type {Array}  of objects or arrays.
   */
  rows: React.PropTypes.arrayOf(React.PropTypes.oneOfType(
    [React.PropTypes.object, React.PropTypes.array])),
  /**
   * make table sortable by clicking on column headers.
   * @type {Boolean}
   */
  sortable: React.PropTypes.bool,
  /**
   * sort column index (default is 0) or column name.
   * @type {Number}
   */
  sortColumn: React.PropTypes.oneOfType([React.PropTypes.number,
    React.PropTypes.string]),
  /**
   * sort order (default is 'asc').
   * @type {String}  one of `asc`, `desc`
   */
  sortOrder: React.PropTypes.oneOf(['asc', 'desc']),
  /**
   * make table rows removable by providing a thrash can button in each row.
   * @type {Boolean}
   */
  removable: React.PropTypes.bool,
  /**
   * callback when user clicks on a sortable column header, function signature
   * is callback(columnName, sortOrder), e.g. `Size`, `asc`. These two
   * values can be used directly with lodash's `_.sortByOrder()` function.
   * @type {Function}
   */
  onColumnHeaderClicked: React.PropTypes.func,
  /**
   * callback when user clicks on a trash can button to delete a row, function
   * signature is `callback(rowIndex)`.
   * @type {Function}
   */
  onRowDeleteButtonClicked: React.PropTypes.func
};

SortableTable.defaultProps = {
  theme: 'light',
  rows: [],
  sortable: true,
  sortColumn: 0,
  sortOrder: 'asc',
  removable: false
};

SortableTable.displayName = 'SortableTable';

module.exports = SortableTable;
