'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var PropTypes = require('prop-types');
var FontAwesome = require('react-fontawesome');
var Button = require('react-bootstrap').Button;
var map = require('lodash.map');
var fill = require('lodash.fill');
var get = require('lodash.get');
var isString = require('lodash.isstring');
var isArray = require('lodash.isarray');
var isPlainObject = require('lodash.isplainobject');
var isNumber = require('lodash.isnumber');

/**
 * The base for the classes.
 */
var BASE = 'sortable-table';

/**
 * Ascending class.
 */
var ASC = 'asc';

/**
 * Descending class.
 */
var DESC = 'desc';

/**
 * Represents a sortable table.
 */

var SortableTable = function (_React$Component) {
  _inherits(SortableTable, _React$Component);

  function SortableTable() {
    _classCallCheck(this, SortableTable);

    return _possibleConstructorReturn(this, (SortableTable.__proto__ || Object.getPrototypeOf(SortableTable)).apply(this, arguments));
  }

  _createClass(SortableTable, [{
    key: 'onBodyRowMouseEnter',


    /**
     * Fires when the user's mouse cursor hovers over a <tr>.
     *
     * @param {Number} index - The row's index in the table.
     * @param {SyntheticEvent} event
     * @see https://reactjs.org/docs/events.html#mouse-events
     */
    value: function onBodyRowMouseEnter(index, event) {
      this.props.onBodyRowMouseEnter(index, event);
    }

    /**
     * Fires when the user's mouse cursor stops hovering over a <tr>.
     *
     * @param {Number} index - The row's index in the table.
     * @param {SyntheticEvent} event
     * @see https://reactjs.org/docs/events.html#mouse-events
     */

  }, {
    key: 'onBodyRowMouseLeave',
    value: function onBodyRowMouseLeave(index, event) {
      this.props.onBodyRowMouseLeave(index, event);
    }

    /**
     * Fires when a column header is clicked.
     *
     * @param {Number} idx - The index.
     * @param {Event} evt - The event.
     */

  }, {
    key: 'onColumnHeaderClicked',
    value: function onColumnHeaderClicked(idx, evt) {
      evt.preventDefault();
      var sortOrder = this.props.sortOrder;
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

  }, {
    key: 'onRowDeleteButtonClicked',
    value: function onRowDeleteButtonClicked(idx, value, evt) {
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

  }, {
    key: '_sortColumnMatch',
    value: function _sortColumnMatch(idxOrName, column) {
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

  }, {
    key: 'renderHeader',
    value: function renderHeader() {
      var _this2 = this;

      var sortClass = 'sort-' + this.props.sortOrder.toLowerCase();
      var cells = map(this.props.columns, function (col, idx) {
        var active = _this2._sortColumnMatch(_this2.props.sortColumn, col) ? ' ' + BASE + '-th-is-active' : '';
        var sortIcon = _this2.props.sortable ? React.createElement(FontAwesome, { className: BASE + '-sort-icon', name: sortClass, fixedWidth: true }) : null;
        return React.createElement(
          'th',
          { className: 'sortable-table-th' + active, key: 'th-' + idx, onClick: _this2.onColumnHeaderClicked.bind(_this2, idx) },
          col,
          sortIcon
        );
      });
      if (this.props.removable) {
        cells.push(React.createElement('th', { key: 'th-delete', className: BASE + '-th ' + BASE + '-th-is-last-col' }));
      }
      return cells;
    }

    /**
     * Render the table rows.
     *
     * @returns {React.Component} The rows.
     */

  }, {
    key: 'renderRows',
    value: function renderRows() {
      var _this3 = this;

      return map(this.props.rows, function (row, rowIndex) {
        // allow both objects and arrays as rows. if object, convert to array
        // in sort order of column names (column names must match exactly).
        if (isPlainObject(row)) {
          // turn into array sorted by the column name keys
          row = map(_this3.props.columns, function (col) {
            return get(row, col, '');
          });
        }
        if (!isArray(row)) {
          row = [];
        }
        if (row.length < _this3.props.columns.length) {
          // pad the array with empty strings at the end if it's not as long as
          // the columns array
          row = row.concat(fill(Array(_this3.props.columns.length - row.length)));
        } else if (row.length > _this3.props.columns.length) {
          row = row.slice(0, _this3.props.columns.length);
        }
        var cells = map(row, function (cell, columnIndex) {
          var title = isString(cell) ? cell : get(cell, 'props.children', '');
          return React.createElement(
            'td',
            {
              className: BASE + '-td',
              'data-test-id': BASE + '-column-' + columnIndex,
              title: title,
              key: 'td-' + columnIndex },
            cell
          );
        });
        if (_this3.props.removable) {
          // add a column with a delete button if the `removable` prop was set
          var valueCell = row[_this3.props.valueIndex];
          var valueStr = isString(valueCell) ? valueCell : get(valueCell, 'props.children', '');
          cells.push(React.createElement(
            'td',
            {
              className: BASE + '-td',
              key: 'td-delete',
              'data-test-id': BASE + '-delete',
              title: 'Delete ' + valueStr },
            React.createElement(
              Button,
              {
                className: BASE + '-trash-button',
                bsSize: 'sm',
                onClick: _this3.onRowDeleteButtonClicked.bind(_this3, rowIndex, valueStr) },
              React.createElement(FontAwesome, { className: BASE + '-trash-icon', name: 'trash-o' })
            )
          ));
        }
        return React.createElement(
          'tr',
          {
            className: BASE + '-tbody-tr', key: 'tr-' + rowIndex,
            onMouseEnter: _this3.onBodyRowMouseEnter.bind(_this3, rowIndex),
            onMouseLeave: _this3.onBodyRowMouseLeave.bind(_this3, rowIndex) },
          cells
        );
      });
    }

    /**
     * Render the component.
     *
     * @returns {React.Component} The table component.
     */

  }, {
    key: 'render',
    value: function render() {
      return React.createElement(
        'div',
        { className: BASE + ' ' + BASE + '-is-' + this.props.theme + '-theme' },
        React.createElement(
          'table',
          { className: BASE + '-table' },
          React.createElement(
            'thead',
            null,
            React.createElement(
              'tr',
              { className: BASE + '-thead-tr' },
              this.renderHeader()
            )
          ),
          React.createElement(
            'tbody',
            null,
            this.renderRows()
          )
        )
      );
    }
  }]);

  return SortableTable;
}(React.Component);

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
  rows: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.object, PropTypes.array])),
  /**
   * make table sortable by clicking on column headers.
   * @type {Boolean}
   */
  sortable: PropTypes.bool,
  /**
   * sort column index (default is 0) or column name.
   * @type {Number}
   */
  sortColumn: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
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
  onBodyRowMouseEnter: function onBodyRowMouseEnter() {},
  onBodyRowMouseLeave: function onBodyRowMouseLeave() {},
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