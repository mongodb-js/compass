const React = require('react');
const PropTypes = require('prop-types');
const FontAwesome = require('react-fontawesome');
const Button = require('react-bootstrap').Button;
const map = require('lodash.map');
const fill = require('lodash.fill');
const get = require('lodash.get');
const isString = require('lodash.isstring');
const isArray = require('lodash.isarray');
const isPlainObject = require('lodash.isplainobject');
const isNumber = require('lodash.isnumber');

/**
 * The base for the classes.
 */
const BASE = 'sortable-table';

/**
 * Ascending class.
 */
const ASC = 'asc';

/**
 * Descending class.
 */
const DESC = 'desc';

/**
 * Represents a sortable table.
 */
class SortableTable extends React.Component {

  /**
   * Fires when the user's mouse cursor hovers over a <tr>.
   *
   * @param {Number} index - The row's index in the table.
   * @param {SyntheticEvent} event
   * @see https://reactjs.org/docs/events.html#mouse-events
   */
  onBodyRowMouseEnter(index, event) {
    this.props.onBodyRowMouseEnter(index, event);
  }

  /**
   * Fires when the user's mouse cursor stops hovering over a <tr>.
   *
   * @param {Number} index - The row's index in the table.
   * @param {SyntheticEvent} event
   * @see https://reactjs.org/docs/events.html#mouse-events
   */
  onBodyRowMouseLeave(index, event) {
    this.props.onBodyRowMouseLeave(index, event);
  }

  /**
   * Fires when a column header is clicked.
   *
   * @param {Number} idx - The index.
   * @param {Event} evt - The event.
   */
  onColumnHeaderClicked(idx, evt) {
    evt.preventDefault();
    let sortOrder = this.props.sortOrder;
    if (this._sortColumnMatch(idx, this.props.sortColumn)) {
      sortOrder = sortOrder === ASC ? DESC : ASC;
    }
    if (this.props.onColumnHeaderClicked) {
      this.props.onColumnHeaderClicked(this.props.columns[idx], sortOrder);
    }
  }

  /**
   * Fires when the row delete button is clicked.
   *
   * @param {Number} idx - The index.
   * @param {Object} value - The value.
   * @param {Event} evt - The event.
   */
  onRowDeleteButtonClicked(idx, value, evt) {
    evt.preventDefault();
    if (this.props.onRowDeleteButtonClicked) {
      this.props.onRowDeleteButtonClicked(idx, value);
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
    if (isNumber(idxOrName)) {
      return this.props.columns[idxOrName] === column;
    }
    return idxOrName === column;
  }

  /**
   * Render the table header.
   *
   * @returns {React.Component} The table header.
   */
  renderHeader() {
    const sortClass = `sort-${this.props.sortOrder.toLowerCase()}`;
    const cells = map(this.props.columns, (col, idx) => {
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

  getStringValueFromCell(cell) {
    if(isString(cell)) {
      return cell;
    }

    const fromChild = get(cell, 'props.children', '');
    if (isArray(fromChild)) {
      return fromChild[0].props.children;
    }
    return fromChild;
  }

  /**
   * Render the table rows.
   *
   * @returns {React.Component} The rows.
   */
  renderRows() {
    return map(this.props.rows, (row, rowIndex) => {
      // allow both objects and arrays as rows. if object, convert to array
      // in sort order of column names (column names must match exactly).
      if (isPlainObject(row)) {
        // turn into array sorted by the column name keys
        row = map(this.props.columns, (col) => {
          return get(row, col, '');
        });
      }
      if (!isArray(row)) {
        row = [];
      }
      if (row.length < this.props.columns.length) {
        // pad the array with empty strings at the end if it's not as long as
        // the columns array
        row = row.concat(fill(Array(this.props.columns.length - row.length)));
      } else if (row.length > this.props.columns.length) {
        row = row.slice(0, this.props.columns.length);
      }
      const cells = map(row, (cell, columnIndex) => {
        const title = this.getStringValueFromCell(cell);
        return (
          <td
            className={`${BASE}-td`}
            data-test-id={`${BASE}-column-${columnIndex}`}
            title={title}
            key={`td-${columnIndex}`}>
            {cell}
          </td>
        );
      });
      if (this.props.removable) {
        // add a column with a delete button if the `removable` prop was set
        const valueCell = row[this.props.valueIndex];
        const valueStr = this.getStringValueFromCell(valueCell);
        cells.push(
          <td
            className={`${BASE}-td`}
            key="td-delete"
            data-test-id={`${BASE}-delete`}
            title={`Delete ${valueStr}`}>
            <Button
              className={`${BASE}-trash-button`}
              bsSize="sm"
              onClick={this.onRowDeleteButtonClicked.bind(this, rowIndex, valueStr)} >
              <FontAwesome className={`${BASE}-trash-icon`} name="trash-o" />
            </Button>
          </td>
        );
      }
      return (
        <tr
          className={`${BASE}-tbody-tr`} key={`tr-${rowIndex}`}
          onMouseEnter={this.onBodyRowMouseEnter.bind(this, rowIndex)}
          onMouseLeave={this.onBodyRowMouseLeave.bind(this, rowIndex)}>
          {cells}
        </tr>
      );
    });
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The table component.
   */
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
  theme: PropTypes.oneOf(['light', 'dark']),
  /**
   * specify column names (required)
   * @type {Array}  of column names (strings).
   */
  columns: PropTypes.arrayOf(PropTypes.string).isRequired,
  /**
   * specify data for table rows. Can be an array of objects (keys must
   * match column names exactly), or an array of arrays. Columns not found in
   * the object are left blank. Inner arrays are padded (if too short) or
   * cropped (if too long).
   * @type {Array}  of objects or arrays.
   */
  rows: PropTypes.arrayOf(PropTypes.oneOfType(
    [PropTypes.object, PropTypes.array])),
  /**
   * make table sortable by clicking on column headers.
   * @type {Boolean}
   */
  sortable: PropTypes.bool,
  /**
   * sort column index (default is 0) or column name.
   * @type {Number}
   */
  sortColumn: PropTypes.oneOfType([PropTypes.number,
    PropTypes.string]),
  /**
   * sort order (default is 'asc').
   * @type {String}  one of `asc`, `desc`
   */
  sortOrder: PropTypes.oneOf(['asc', 'desc']),
  /**
   * make table rows removable by providing a thrash can button in each row.
   * @type {Boolean}
   */
  removable: PropTypes.bool,
  /**
   * Fires when the user's mouse cursor hovers over a <tr>.
   * @type {Function}
   */
  onBodyRowMouseEnter: PropTypes.func,
  /**
   * Fires when the user's mouse cursor stops hovering over a <tr>.
   * @type {Function}
   */
  onBodyRowMouseLeave: PropTypes.func,
  /**
   * callback when user clicks on a sortable column header, function signature
   * is callback(columnName, sortOrder), e.g. `Size`, `asc`. These two
   * values can be used directly with lodash's `_.sortByOrder()` function.
   * @type {Function}
   */
  onColumnHeaderClicked: PropTypes.func,
  /**
   * callback when user clicks on a trash can button to delete a row, function
   * signature is `callback(rowIndex)`.
   * @type {Function}
   */
  onRowDeleteButtonClicked: PropTypes.func,
  /**
   * The index in the columns to pass as a second value to the delete function.
   * @type {Number}
   */
  valueIndex: PropTypes.number
};

SortableTable.defaultProps = {
  onBodyRowMouseEnter: () => {},
  onBodyRowMouseLeave: () => {},
  theme: 'light',
  rows: [],
  sortable: true,
  sortColumn: 0,
  sortOrder: 'asc',
  removable: false,
  valueIndex: 0
};

SortableTable.displayName = 'SortableTable';

module.exports = SortableTable;
