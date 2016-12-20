const React = require('react');
const FontAwesome = require('react-fontawesome');
const Button = require('react-bootstrap').Button;
const _ = require('lodash');

/**
 * The base for the classes.
 */
const BASE = 'sortable-table';

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

  onRowDeleteButtonClicked(idx, value, evt) {
    evt.preventDefault();
    if (this.props.onRowDeleteButtonClicked) {
      this.props.onRowDeleteButtonClicked(idx, value);
    }
  }

  onNameClicked(idx, name, evt) {
    evt.preventDefault();
    if (this.props.onNameClicked) {
      this.props.onNameClicked(idx, name);
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
      const active = this._sortColumnMatch(this.props.sortColumn, col) ? ` ${BASE}-th-is-active` : '';
      const sortIcon = this.props.sortable ?
        <FontAwesome className={`${BASE}-sort-icon`} name={sortClass} fixedWidth /> : null;
      return (
        <th className={`sortable-table-th${active}`} key={`th-${idx}`} onClick={this.onColumnHeaderClicked.bind(this, idx)}>
          {col}
          {sortIcon}
        </th>
      );
    });
    if (this.props.removable) {
      cells.push(<th key="th-delete" className={`${BASE}-th ${BASE}-th-is-last-col`}></th>);
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
        return (
          <td
            className={`${BASE}-td`}
            data-test-id={`${BASE}-column-${c}`}
            title={cell}
            key={`td-${c}`}>
            {c === 0 ?
              <a className={`${BASE}-row-name`} onClick={this.onNameClicked.bind(this, r, cell)}>{cell}</a> : cell
            }
          </td>
        );
      });
      if (this.props.removable) {
        // add a column with a delete button if the `removable` prop was set
        const name = _.get(row, this.props.valueIndex, 0);
        cells.push(
          <td
            className={`${BASE}-td`}
            key="td-delete"
            data-test-id={`${BASE}-delete`}
            title={`Delete ${name}`}>
            <Button
              className={`${BASE}-trash-button`}
              onClick={this.onRowDeleteButtonClicked.bind(this, r, name)} >
              <FontAwesome className={`${BASE}-trash-icon`} name="trash-o" />
            </Button>
          </td>
        );
      }
      return <tr className={`${BASE}-tbody-tr`} key={`tr-${r}`}>{cells}</tr>;
    });
  }

  render() {
    return (
      <div className={`${BASE} ${BASE}-is-${this.props.theme}-theme`}>
        <table className={`${BASE}-table`}>
          <thead>
            <tr className={`${BASE}-thead-tr`}>
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
  onRowDeleteButtonClicked: React.PropTypes.func,
  /**
   * callback when user clicks on the name (first row element)
   * @type {Function}
   */
  onNameClicked: React.PropTypes.func,
  /**
   * The index in the columns to pass as a second value to the delete function.
   * @type {Number}
   */
  valueIndex: React.PropTypes.number
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
