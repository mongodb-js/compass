const React = require('react');
const PropTypes = require('prop-types');
const {AgGridReact} = require('ag-grid-react');
const _ = require('lodash');

const { StoreConnector } = require('hadron-react-components');
const TypeChecker = require('hadron-type-checker');
const HadronDocument = require('hadron-document');

const GridStore = require('../stores/grid-store');
const BreadcrumbStore = require('../stores/breadcrumb-store');
const BreadcrumbComponent = require('./breadcrumb');
const CellRenderer = require('./table-view/cell-renderer');
const FullWidthCellRenderer = require('./table-view/full-width-cell-renderer');
const HeaderComponent = require('./table-view/header-cell-renderer');
const CellEditor = require('./table-view/cell-editor');

// const util = require('util');

/**
 * Represents the table view of the documents tab.
 */
class DocumentListTableView extends React.Component {
  constructor(props) {
    super(props);
    this.createColumnHeaders = this.createColumnHeaders.bind(this);
    this.createRowData = this.createRowData.bind(this);
    this.addEditingFooter = this.addEditingFooter.bind(this);
    this.onRowClicked = this.onRowClicked.bind(this);
    this.getColDef = this.getColDef.bind(this);

    this.gridOptions = {
      context: {
        column_width: 150,
        addHeader: this.getColDef
      },
      onRowClicked: this.onRowClicked,
      // onCellClicked: this.onCellClicked.bind(this)
      rowHeight: 28  // .document-footer row needs 28px, ag-grid default is 25px
    };
  }

  componentDidMount() {
    this.unsubscribeGridStore = GridStore.listen(this.modifyColumns.bind(this));
  }

  componentWillUnmount() {
    this.unsubscribeGridStore();
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
  }

  // /**
  //  * @param {Object} event
  //  *    column: Column, // the column for the cell in question
  //  *    colDef: ColDef, // the column definition for the cell in question
  //  *    value: any // the value for the cell in question
  //  */
  // onCellClicked(event) {
  //   // console.log('a cell was clicked + event=');
  // }

  /**
   * Callback for when a row is clicked.
   *
   * @param {Object} event
   *     node {RowNode} - the RowNode for the row in question
   *     data {*} - the user provided data for the row in question
   *     rowIndex {number} - the visible row index for the row in question
   *     rowPinned {string} - 'top', 'bottom' or undefined / null if not pinned
   *     context: {*} - bag of attributes, provided by user, see Context
   *     event?: {Event} - event if this was result of a browser event
   */
  onRowClicked(event) {
    if (this.props.isEditable) {
      this.addEditingFooter(event.node, event.data, event.rowIndex);
    }
  }

  getColDef(key, type, isEditable) {
    return {
      headerName: key,
      colId: key,
      valueGetter: function(params) {
        return params.data.hadronDocument.get(key);
      },
      valueSetter: function(params) {
        if (params.oldValue === undefined && params.newValue === undefined) {
          return false;
        }
        return params.newValue.isEdited() || params.newValue.isAdded() || params.newValue.isRemoved();
      },

      headerComponentFramework: HeaderComponent,
      headerComponentParams: {
        isRowNumber: false,
        bsonType: type
      },

      cellRendererFramework: CellRenderer,
      cellRendererParams: {},

      editable: function(params) {
        if (!isEditable || params.node.data.state === 'deleting') {
          return false;
        }
        if (params.node.data.hadronDocument.get(key) === undefined) {
          return true;
        }
        return params.node.data.hadronDocument.get(key).isValueEditable();
      },

      cellEditorFramework: CellEditor,
      cellEditorParams: {}
    };
  }

  /**
   * Add a row to the table that represents the update/cancel footer for the
   * row directly above. The row will be a full-width row that has the same
   * hadron-document as the "data" row above.
   *
   * @param {RowNode} rowNode - The RowNode for the row that was clicked on.
   * @param {object} data - The data for the row that was clicked on. Will be a
   *  HadronDocument with some metadata.
   * @param {number} rowIndex - Index of the row clicked on.
   */
  addEditingFooter(rowNode, data, rowIndex) {
    /* Ignore clicks on footers or data rows that already have footers */
    if (data.isFooter || data.hasFooter) {
      return;
    }

    /* Add footer below this row */
    rowNode.data.hasFooter = true;
    rowNode.data.state = 'editing';
    const newData = {
      hadronDocument: data.hadronDocument,
      hasFooter: false,
      isFooter: true,
      state: 'editing'
    };
    this.gridApi.updateRowData({add: [newData], addIndex: rowIndex + 1});
  }

  /**
   * Add a row to the table that represents the delete/cancel footer for the
   * row directly above. The row will be a full-width row that has the same
   * hadron-document as the "data" row above.
   *
   * @param {RowNode} rowNode - The RowNode for the row that was clicked on.
   * @param {object} data - The data for the row that was clicked on. Will be a
   *  HadronDocument with some metadata.
   * @param {number} rowIndex - Index of the row clicked on.
   */
  addDeletingFooter(rowNode, data, rowIndex) {
    if (data.isFooter || data.state === 'deleting') {
      return;
    } else if (data.hasFooter) {
      /* If bar exists and is in editing mode, set this row deleting and also
       * this rows' footer's state to deleting. */

      data.state = 'deleting';
      const rowId = data.hadronDocument.get('_id').value.toString() + '1';

      const footerNode = this.gridApi.getRowNode(rowId);
      footerNode.data.state = 'deleting';

      /* rerender footer */
      this.gridApi.redrawRows([footerNode]);
      return;
    }

    /* Add deleting row below this row */
    rowNode.data.hasFooter = true;
    rowNode.data.state = 'deleting';
    const newData = {
      hadronDocument: data.hadronDocument,
      hasFooter: false,
      isFooter: true,
      state: 'deleting'
    };
    this.gridApi.updateRowData({add: [newData], addIndex: rowIndex + 1});
  }

  /**
   * The user has added a new field in the cell editor or needs to remove
   * an entire column.
   *
   * @param {String} columnId - The name of the column that will come
   * immediately before the new element, or the column to be deleted.
   * @param {number} rowNum - The row where the new column was added, or -1.
   */
  modifyColumns(columnId, rowNum) {
    /* Have to calculate the index of the neighbor column */
    const columns = this.columnApi.getAllColumns();

    let i = 0;
    while (i < columns.length) {
      if (columns[i].getColDef().colId === columnId) {
        break;
      }
      i++;
    }

    const columnHeaders = _.map(columns, function(col) {
      return col.getColDef();
    });

    if (rowNum === -1) {
      /* Remove column */
      columnHeaders.splice(i, 1);
    } else {
      /* Add new column */
      const newColDef = this.getColDef('$new', '', this.props.isEditable);
      columnHeaders.splice(i + 1, 0, newColDef);
    }

    this.gridApi.setColumnDefs(columnHeaders);

    if (rowNum !== -1) {
      this.gridApi.startEditingCell({rowIndex: rowNum, colKey: '$new'});
    }
  }

  /**
   * Define all the columns in table and their renderer components.
   *
   * @returns {object} the ColHeaders
   */
  createColumnHeaders() {
    const headers = {};
    // const width = this.gridOptions.context.column_width;
    const isEditable = this.props.isEditable;

    const addHeader = this.getColDef;

    headers.hadronRowNumber = {
      headerName: 'Row',
      field: 'rowNumber',
      headerComponentFramework: HeaderComponent,
      headerComponentParams: {
        isRowNumber: true
      }
    };

    for (let i = 0; i < this.props.docs.length; i++) {
      _.map(this.props.docs[i], function(val, key) {
        headers[key] = addHeader(key, TypeChecker.type(val), isEditable);
      });
    }
    return Object.values(headers);
  }

  /**
   * Create data for each document row. Contains a HadronDocument and some
   * metadata.
   *
   * @returns {Array} A list of HadronDocument wrappers.
   */
  createRowData() {
    return _.map(this.props.docs, function(val, i) {
      // TODO: Make wrapper object for HadronDocument
      return {
        /* The same doc is shared between a document row and it's footer */
        hadronDocument: new HadronDocument(val),
        /* Is this row an footer row or document row? */
        isFooter: false,
        /* If this is a document row, does it already have a footer? */
        hasFooter: false,
        /* If this is a footer, state is 'editing' or 'deleting' */
        state: null,
        /* Add a row number for the first column */
        rowNumber: i + 1
      };
    });
  }

  /**
   * Render the document table view.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const containerStyle = {
      height: 1000,
      width: 1200
    };

    return (
      <div>
        <StoreConnector store={BreadcrumbStore}>
          <BreadcrumbComponent/>
        </StoreConnector>
        <div style={containerStyle}>
          <AgGridReact
            // properties
            columnDefs={this.createColumnHeaders()}
            gridOptions={this.gridOptions}

            isFullWidthCell={(rowNode)=>{return rowNode.data.isFooter;}}
            fullWidthCellRendererFramework={FullWidthCellRenderer}

            rowData={this.createRowData()}
            getRowNodeId={function(data) {
              const fid = data.isFooter ? '1' : '0';
              return data.hadronDocument.get('_id').value.toString() + fid;
            }}
            // events
            onGridReady={this.onGridReady.bind(this)}
        />
        </div>
      </div>
    );
  }
}

DocumentListTableView.propTypes = {
  docs: PropTypes.array.isRequired,
  isEditable: PropTypes.bool.isRequired
};

DocumentListTableView.displayName = 'DocumentListTableView';

module.exports = DocumentListTableView;
