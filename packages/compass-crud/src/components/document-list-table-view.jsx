const React = require('react');
const PropTypes = require('prop-types');
const {AgGridReact} = require('ag-grid-react');
const _ = require('lodash');

const { StoreConnector } = require('hadron-react-components');
const TypeChecker = require('hadron-type-checker');
const HadronDocument = require('hadron-document');

const Actions = require('../actions');
const GridStore = require('../stores/grid-store');
const BreadcrumbStore = require('../stores/breadcrumb-store');
const BreadcrumbComponent = require('./breadcrumb');
const CellRenderer = require('./table-view/cell-renderer');
const FullWidthCellRenderer = require('./table-view/full-width-cell-renderer');
const RowActionsRenderer = require('./table-view/row-actions-renderer');
const HeaderComponent = require('./table-view/header-cell-renderer');
const CellEditor = require('./table-view/cell-editor');

// const util = require('util');

const MIXED = 'Mixed';

/**
 * Represents the table view of the documents tab.
 */
class DocumentListTableView extends React.Component {
  constructor(props) {
    super(props);
    this.createColumnHeaders = this.createColumnHeaders.bind(this);
    this.createRowData = this.createRowData.bind(this);
    this.addEditingFooter = this.addEditingFooter.bind(this);
    this.onRowDoubleClicked = this.onRowDoubleClicked.bind(this);
    this.createColumnHeader = this.createColumnHeader.bind(this);
    this.updateHeaders = this.updateHeaders.bind(this);

    this.gridOptions = {
      context: {
        column_width: 150,
        onRowDoubleClicked: this.onRowDoubleClicked
      },
      onRowDoubleClicked: this.onRowDoubleClicked,
      onCellClicked: this.onCellClicked.bind(this),
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

  /**
   * @param {Object} event
   */
  onCellClicked(event) {
    if (event.data.state === 'editing') {
      event.api.startEditingCell({rowIndex: event.node.rowIndex, colKey: event.column.getColId()});
    }
  }

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
  onRowDoubleClicked(event) {
    if (this.props.isEditable) {
      this.addEditingFooter(event.node, event.data, event.rowIndex);
    }
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
    this.gridApi.refreshCells({rowNodes: [rowNode], columns: ['$rowActions'], force: true});

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
   * Add a column to the grid to the right of the column with colId.
   *
   * @param {String} colId - The new column will be inserted after the column
   * with colId.
   */
  addColumn(colId) {
    const columnHeaders = _.map(this.columnApi.getAllColumns(), function(col) {
      return col.getColDef();
    });

    let i = 0;
    while (i < columnHeaders.length) {
      if (columnHeaders[i].colId === colId) {
        break;
      }
      i++;
    }

    const newColDef = this.createColumnHeader('$new', '', true); // Newly added columns are always editable.
    columnHeaders.splice(i + 1, 0, newColDef);
    this.gridApi.setColumnDefs(columnHeaders);
  }

  /**
   * Remove a list of columns from the grid.
   *
   * @param {Array} colIds - The list of colIds that will be removed.
   */
  removeColumns(colIds) {
    const columnHeaders = _.map(this.columnApi.getAllColumns(), function(col) {
      return col.getColDef();
    });

    const indexes = [];
    for (let i = 0; i < columnHeaders.length; i++) {
      if (colIds.includes(columnHeaders[i].colId)) {
        indexes.push(i);
      }
    }
    for (let i = 0; i < indexes.length; i++) {
      columnHeaders.splice(indexes[i], 1);
    }
    this.gridApi.setColumnDefs(columnHeaders);
  }

  /**
   * When the header component's types have changed, need to update the
   * HeaderComponentParams in the column definitions.
   *
   * @param {Object} showing - A mapping of columnId to new displayed type.
   * @param {Object} columnHeaders - The column definitions. We get them from
   * calling columnApi.getAllColumns(), except when we are initializing the
   * grid (since columnApi doesn't exist until the grid is ready).
   */
  updateHeaders(showing, columnHeaders) {
    const colIds = Object.keys(showing);
    for (let i = 0; i < columnHeaders.length; i++) {
      if (colIds.includes(columnHeaders[i].colId)) {
        columnHeaders[i].headerComponentParams.bsonType = showing[columnHeaders[i].colId];
      }
    }
  }

  /**
   * This is called when there is a change to the data so that the column headers
   * must be modified. This is called when a element is added, deleted, or the
   * type has changed and the headers need to be updated to reflect the new type
   * of the column.
   *
   * @param {Object} params - The set of optional params.
   *   Adding a column:
   *    params.add.colId - The columnId that the new column will be added next to.
   *    params.add.rowIndex - The index of row which added the new column. Required
   *      so that we can open up the new field for editing.
   *   Deleting columns:
   *    params.remove.colIds - The array of columnIds to be deleted.
   *   Updating headers:
   *    params.updateHeaders.showing - A mapping of columnId to BSON type. The
   *      new bson type will be forwarded to the column headers.
   */
  modifyColumns(params) {
    if ('add' in params) {
      this.addColumn(params.add.colId);
      this.gridApi.startEditingCell({rowIndex: params.add.rowIndex, colKey: '$new'});
    }
    if ('remove' in params) {
      this.removeColumns(params.remove.colIds);
    }
    if ('updateHeaders' in params) {
      const columnHeaders = _.map(this.columnApi.getAllColumns(), function(col) {
        return col.getColDef();
      });

      this.updateHeaders(params.updateHeaders.showing, columnHeaders);
      this.gridApi.refreshHeader();
    }
  }

  createColumnHeader(key, type, isEditable) {
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
        hide: false,
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
   * Define all the columns in table and their renderer components.
   *
   * @returns {object} the ColHeaders
   */
  createColumnHeaders() {
    const headers = {};
    const headerTypes = {};
    // const width = this.gridOptions.context.column_width;
    const isEditable = this.props.isEditable;
    const docs = this.props.docs;

    const addHeader = this.createColumnHeader;

    headers.hadronRowNumber = {
      headerName: 'Row',
      field: 'rowNumber',
      colId: '$rowNumber', // TODO: make sure user can't get duplicate
      headerComponentFramework: HeaderComponent,
      headerComponentParams: {
        hide: true
      }
    };

    /* Make column definitions + track type for header components */
    for (let i = 0; i < docs.length; i++) {
      _.map(docs[i], function(val, key) {
        const type = TypeChecker.type(val);
        headers[key] = addHeader(key, type, isEditable);

        if (!(key in headerTypes)) {
          headerTypes[key] = {};
        }
        headerTypes[key][docs[i]._id.toString()] = type;
      });
    }

    /* Set header types correctly in GridStore */
    Actions.resetHeaders(headerTypes);

    /* Set header types correctly in the column definitions to be passed to
     the grid. This is handled here for the initial header values, and then
     in the GridStore for any subsequent updates. */
    const columnHeaders = Object.values(headers);
    const showing = {};

    _.map(headerTypes, function(oids, key) {
      const types = Object.values(oids);
      let currentType = types[0];
      for (let i = 0; i < types.length; i++) {
        if (currentType !== types[i]) {
          currentType = MIXED;
          break;
        }
      }
      showing[key] = currentType;
    });
    this.updateHeaders(showing, columnHeaders);

    /* Add button action row column */
    columnHeaders.push({
      colId: '$rowActions',
      valueGetter: function(params) {
        return params.data;
      },

      headerComponentFramework: HeaderComponent,
      headerComponentParams: {
        hide: true
      },

      cellRendererFramework: RowActionsRenderer,
      cellRendererParams: {},
      editable: false,
      pinned: 'right'
    });

    /* Return the updated column definitions */
    return columnHeaders;
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
