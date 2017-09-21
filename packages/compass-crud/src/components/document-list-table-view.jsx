const React = require('react');
const PropTypes = require('prop-types');
const {AgGridReact} = require('ag-grid-react');
const _ = require('lodash');

const { StoreConnector } = require('hadron-react-components');
const TypeChecker = require('hadron-type-checker');
const HadronDocument = require('hadron-document');
const ObjectId = require('bson').ObjectId;

const Actions = require('../actions');

const GridStore = require('../stores/grid-store');
const BreadcrumbStore = require('../stores/breadcrumb-store');
const InsertDocumentStore = require('../stores/insert-document-store');
const ResetDocumentListStore = require('../stores/reset-document-list-store');
const TablePageStore = require('../stores/table-page-store');

const BreadcrumbComponent = require('./breadcrumb');
const CellRenderer = require('./table-view/cell-renderer');
const FullWidthCellRenderer = require('./table-view/full-width-cell-renderer');
const RowActionsRenderer = require('./table-view/row-actions-renderer');
const HeaderComponent = require('./table-view/header-cell-renderer');
const CellEditor = require('./table-view/cell-editor');

/* eslint react/sort-comp:0 */

const MIXED = 'Mixed';

/**
 * Represents the table view of the documents tab.
 */
class DocumentListTableView extends React.Component {
  constructor(props) {
    super(props);
    this.createColumnHeaders = this.createColumnHeaders.bind(this);
    this.createColumnHeader = this.createColumnHeader.bind(this);
    this.createRowData = this.createRowData.bind(this);
    this.updateHeaders = this.updateHeaders.bind(this);
    this.removeFooter = this.removeFooter.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
    this.handleUpdate = this.handleUpdate.bind(this);
    this.addFooter = this.addFooter.bind(this);
    this.handleClone = this.handleClone.bind(this);

    this.state = { docs: props.docs, index: 1 };
    this.AGGrid = this.createGrid();
  }

  componentDidMount() {
    this.unsubscribeGridStore = GridStore.listen(this.modifyColumns.bind(this));
    this.unsubscribeInsert = InsertDocumentStore.listen(this.handleInsert.bind(this));
    this.unsubscribeReset = ResetDocumentListStore.listen(this.handleReset.bind(this));
    this.unsubscribeLoadMore = TablePageStore.listen(this.handlePageChange.bind(this));
  }

  componentWillUnmount() {
    this.unsubscribeGridStore();
    this.unsubscribeReset();
    this.unsubscribeInsert();
    this.unsubscribeLoadMore();
  }

  createGrid() {
    this.gridOptions = {
      context: {
        column_width: 150,
        addFooter: this.addFooter,
        removeFooter: this.removeFooter,
        handleUpdate: this.handleUpdate,
        handleRemove: this.handleRemove,
        handleClone: this.handleClone
      },
      onCellDoubleClicked: this.onCellDoubleClicked.bind(this),
      rowHeight: 28  // .document-footer row needs 28px, ag-grid default is 25px
    };

    const gridProps = {
      columnDefs: this.createColumnHeaders(),
      gridOptions: this.gridOptions,

      isFullWidthCell: function(rowNode) {
        return rowNode.data.isFooter;
      },
      fullWidthCellRendererFramework: FullWidthCellRenderer,

      rowData: this.createRowData(this.state.docs),
      getRowNodeId: function(data) {
        const fid = data.isFooter ? '1' : '0';
        return data.hadronDocument.get('_id').value.toString() + fid;
      },
      onGridReady: this.onGridReady.bind(this)
    };

    return React.createElement(
      AgGridReact,
      gridProps,
    );
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
  }

  /**
   * Callback for when a cell is double clicked.
   *
   * @param {Object} event
   *     node {RowNode} - the RowNode for the row in question
   *     data {*} - the user provided data for the row in question
   */
  onCellDoubleClicked(event) {
    this.addFooter(event.node, event.data, 'editing');
  }

  /**
   * Add a row to the table that represents the update/cancel footer for the
   * row directly above. The row will be a full-width row that has the same
   * hadron-document as the "document row" above.
   *
   * @param {RowNode} node - The RowNode for the document row.
   * @param {object} data - The data for the document row.
   * @param {String} state - Either an editing, deleting, or cloned footer.
   */
  addFooter(node, data, state) {
    /* Ignore clicks on footers or document rows that already have footers */
    if (!this.props.isEditable || data.isFooter || data.hasFooter) {
      return;
    }

    /* Add footer below this row */
    node.data.hasFooter = true;
    node.data.state = state;
    this.gridApi.refreshCells({rowNodes: [node], columns: ['$rowActions'], force: true});

    const newData = {
      hadronDocument: data.hadronDocument,
      hasFooter: false,
      isFooter: true,
      state: state
    };
    this.gridApi.updateRowData({add: [newData], addIndex: node.rowIndex + 1});
  }

  /**
   * A row has finished editing and the footer needs to be removed and the state
   * set back to null.
   *
   * @param {RowNode} node - The RowNode of the footer that is being removed.
   */
  removeFooter(node) {
    const api = this.gridApi;
    /* rowId is the document row */
    const rowId = node.data.hadronDocument.get('_id').value.toString() + '0';
    const dataNode = api.getRowNode(rowId);

    setTimeout(function() {
      /* This data gets reset twice if being called from handleUpdate */
      dataNode.data.hasFooter = false;
      dataNode.data.state = null;
      api.refreshCells({rowNodes: [dataNode], columns: ['$rowActions'], force: true});
      api.updateRowData({remove: [node.data]});
      api.clearFocusedCell();
    }, 0);
  }

  /**
   * A row has either been deleted or updated successfully.
   *
   * @param {RowNode} node - The RowNode of the footer of the document that is being removed.
   */
  handleRemove(node) {
    const api = this.gridApi;
    const oid = node.data.hadronDocument.get('_id').value.toString();

    /* rowId is the document row */
    const rowId = oid + '0';
    const dataNode = api.getRowNode(rowId);

    /* Update the row numbers */
    this.updateRowNumbers(dataNode.data.rowNumber, false);

    /* Update the grid */
    setTimeout(function() {
      api.updateRowData({remove: [dataNode.data]});
    }, 0);

    /* Remove the footer */
    this.removeFooter(node);

    /* Update the headers */
    for (const element of node.data.hadronDocument.elements) {
      Actions.elementRemoved(element.currentKey, oid, true);
    }

    /* Update the toolbar */
    Actions.documentRemoved();
  }

  /**
   * A row has been updated successfully. We need to set the data to the new
   * values and redraw that row.
   *
   * @param {Object} data - The new data of the row that has been updated.
   */
  handleUpdate(data) {
    const api = this.gridApi;

    const rowId = data._id + '0';
    const dataNode = api.getRowNode(rowId);
    const rowNumber = dataNode.data.rowNumber;

    const newData = this.createRowData([data])[0];
    newData.rowNumber = rowNumber; // Keep old line number

    dataNode.setData(newData);
    api.redrawRows({rowNodes: [dataNode]});

    const footerRowId = data._id + '1';
    const footerNode = api.getRowNode(footerRowId);
    this.removeFooter(footerNode);
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
      this.gridApi.setFocusedCell(params.add.rowIndex, '$new');
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

  /**
   * A row has been inserted and we need to update the row numbers.
   *
   * @param {Number} index - The index where the row was inserted.
   * @param {boolean} insert - If the row has been inserted.
   */
  updateRowNumbers(index, insert) {
    const add = insert ? 1 : -1;
    this.gridApi.forEachNodeAfterFilterAndSort(function(node) {
      if (!node.data.isFooter && node.data.rowNumber >= index) {
        node.data.rowNumber += add;
      }
    });
    this.gridApi.refreshCells({columns: ['$rowNumber']});
  }

  /**
   * Insert a row into the grid.
   *
   * @param {Object} doc - The new document to be added.
   * @param {Number} index - The AG-Grid row index (counting footers)
   * @param {Number} lineNumber - The line number to be shown for the document (not including footers)
   * @param {boolean} edit - If the new row should be opened in editing mode.
   */
  insertRow(doc, index, lineNumber, edit) {
    /* Create the new data */
    const data = this.createRowData([doc])[0];
    data.rowNumber = lineNumber;
    data.state = edit ? 'cloned' : null;

    /* Update row numbers */
    this.updateRowNumbers(lineNumber, true);

    /* Update grid API */
    this.gridApi.updateRowData({add: [data], addIndex: index});

    /* Update the headers */
    for (const element of data.hadronDocument.elements) {
      Actions.elementAdded(element.currentKey, element.currentType, doc._id);
    }

    if (edit) {
      /* Add a footer */
      const rowId = doc._id.toString() + '0';
      const node = this.gridApi.getRowNode(rowId);
      this.addFooter(node, node.data, 'cloned');
    }
  }

  /**
   * Handle insert of a new document.
   *
   * @param {Error} error - Any error that happened.
   * @param {Object} doc - The raw document that was inserted.
   * @param {boolean} clone - If the document was cloned, don't add row.
   */
  handleInsert(error, doc, clone) {
    if (!error && !clone) {
      this.insertRow(doc, 0, 1, false);
    }
  }

  /**
   * The clone button has been clicked on a row.
   *
   * @param {RowNode} node - The node that is going to be cloned.
   */
  handleClone(node) {
    const obj = node.data.hadronDocument.generateObject();
    obj._id = new ObjectId();
    this.insertRow(obj, node.rowIndex + 1, node.data.rowNumber + 1, true);
  }

  /**
   * The documents have changed due to a refresh or load next/previous page.
   *
   * @param {Object} error - Error when trying to load more documents.
   * @param {Array} documents - The next batch of documents.
   * @param {Number} start - The index of the first document shown.
   * @param {Number} end - (Unused) The index of the last document shown.
   */
  handlePageChange(error, documents, start) {
    if (!error) {
      this.setState({docs: documents, index: start});
      this.AGGrid = this.createGrid();
      this.forceUpdate();
    }
  }

  handleReset(error, documents) {
    this.handlePageChange(error, documents, 1);
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
    const docs = this.state.docs;

    const addHeader = this.createColumnHeader;

    headers.hadronRowNumber = {
      headerName: 'Row',
      field: 'rowNumber',
      colId: '$rowNumber', // TODO: make sure user can't get duplicate
      width: 30,
      pinned: 'left',
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
   * @param {Array} documents - A list of JSON documents.
   *
   * @returns {Array} A list of HadronDocument wrappers.
   */
  createRowData(documents) {
    const index = this.state.index;
    return _.map(documents, function(val, i) {
      return {
        /* The same doc is shared between a document row and it's footer */
        hadronDocument: new HadronDocument(val),
        /* Is this row an footer row or document row? */
        isFooter: false,
        /* If this is a document row, does it already have a footer? */
        hasFooter: false,
        /* If this is a footer, state is 'editing' or 'deleting' or 'cloned' */
        state: null,
        /* Add a row number for the first column */
        rowNumber: i + index
      };
    });
  }

  /**
   * Render the document table view.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className="ag-parent">
        <StoreConnector store={BreadcrumbStore}>
          <BreadcrumbComponent/>
        </StoreConnector>
        {this.AGGrid}
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
