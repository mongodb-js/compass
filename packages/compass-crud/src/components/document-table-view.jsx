/* eslint-disable no-loop-func */
const React = require('react');
const PropTypes = require('prop-types');
const {AgGridReact} = require('ag-grid-react');
const _ = require('lodash');

const TypeChecker = require('hadron-type-checker');
const HadronDocument = require('hadron-document');
const ObjectId = require('bson').ObjectId;
const mongodbns = require('mongodb-ns');

const Actions = require('../actions');

const GridStore = require('../stores/grid-store');
const InsertDocumentStore = require('../stores/insert-document-store');
const ResetDocumentListStore = require('../stores/reset-document-list-store');
const PageChangedStore = require('../stores/page-changed-store');
const BreadcrumbStore = require('../stores/breadcrumb-store');

const BreadcrumbComponent = require('./breadcrumb');
const CellRenderer = require('./table-view/cell-renderer');
const RowNumberRenderer = require('./table-view/row-number-renderer');
const FullWidthCellRenderer = require('./table-view/full-width-cell-renderer');
const RowActionsRenderer = require('./table-view/row-actions-renderer');
const HeaderComponent = require('./table-view/header-cell-renderer');
const CellEditor = require('./table-view/cell-editor');

/* eslint react/sort-comp:0 */

const MIXED = 'Mixed';

/**
 * Represents the table view of the documents tab.
 */
class DocumentTableView extends React.Component {
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
    this.updateWidth = this.updateWidth.bind(this);
    this.sharedGridProperties = {
      gridOptions: {
        context: {
          addFooter: this.addFooter,
          removeFooter: this.removeFooter,
          handleUpdate: this.handleUpdate,
          handleRemove: this.handleRemove,
          handleClone: this.handleClone,
          path: []
        },
        onCellDoubleClicked: this.onCellDoubleClicked.bind(this),
        rowHeight: 28,  // .document-footer row needs 28px, ag-grid default is 25px
        getRowStyle: this.updateWidth,
        onGridSizeChanged: this.updateActionsPlacement
      },
      onGridReady: this.onGridReady.bind(this),
      isFullWidthCell: function(rowNode) {
        return rowNode.data.isFooter;
      },
      fullWidthCellRendererFramework: FullWidthCellRenderer,
      fullWidthCellRendererParams: {
        actions: Actions,
        dataService: ResetDocumentListStore.dataService
      },
      getRowNodeId: function(data) {
        const fid = data.isFooter ? '1' : '0';
        return '' + data.hadronDocument.getStringId() + fid;
      }
    };

    this.collection = mongodbns(props.ns).collection;
    this.hadronDocs = [];
    this.start = 1;
    this.topLevel = true;

    this.AGGrid = React.createElement(
      AgGridReact,
      this.sharedGridProperties
    );
  }

  componentDidMount() {
    this.unsubscribeGridStore = GridStore.listen(this.modifyColumns.bind(this));
    this.unsubscribeInsert = InsertDocumentStore.listen(this.handleInsert.bind(this));
    this.unsubscribeReset = ResetDocumentListStore.listen(this.handleReset.bind(this));
    this.unsubscribePageChanged = PageChangedStore.listen(this.handlePageChange.bind(this));
    this.unsubscribeBreadcrumbStore = BreadcrumbStore.listen(this.handleBreadcrumbChange.bind(this));
  }

  componentWillUnmount() {
    this.unsubscribeGridStore();
    this.unsubscribeInsert();
    this.unsubscribeReset();
    this.unsubscribePageChanged();
  }

  /**
   * Initialize the list of HadronDocuments to track changes.
   *
   * @param {Array} docs - List of JSON objects.
   *
   * @returns {Array} - List of HadronDocuments.
   */
  initHadronDocs(docs) {
    return docs.map((doc) => { return new HadronDocument(doc); });
  }

  /**
   * AG-Grid lifecycle method. This is called when the grid has loaded.
   * @param {Object} params - a reference to the gridAPI and the columnAPI.
   */
  onGridReady(params) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
  }

  /**
   * Updates the placement of the document actions panel by moving the entire
   * pinned right column based on how many body columns are visible on the page.
   */
  updateActionsPlacement() {
    if (this.gridApi) {
      const allColumns = this.columnApi.getAllColumns();
      const tableWidth = document.getElementById('borderLayout_eRootPanel').offsetWidth;
      const rightViewport = document.getElementsByClassName('ag-pinned-right-cols-viewport')[0];
      const bodyColumnWidth = ((allColumns.length - 2) * 200 + 50);
      const emptyWidth = tableWidth - bodyColumnWidth;
      if (bodyColumnWidth < tableWidth) {
        rightViewport.style.right = `${emptyWidth}px`;
      } else {
        rightViewport.style.right = '0px';
      }
    }
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
   * hadron-document as the 'document row' above.
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
    /* rowId is the document row */
    const rowId = node.data.hadronDocument.getStringId() + '0';
    const dataNode = this.gridApi.getRowNode(rowId);

    dataNode.data.hasFooter = false;
    dataNode.data.state = null;
    this.gridApi.refreshCells({rowNodes: [dataNode], columns: ['$rowActions'], force: true});
    this.gridApi.clearFocusedCell();
    this.gridApi.updateRowData({remove: [node.data]});
  }

  /**
   * A row has either been deleted or updated successfully. Deletes both the footer
   * and the document row.
   *
   * @param {RowNode} node - The RowNode of the footer of the document that is being removed.
   */
  handleRemove(node) {
    const oid = node.data.hadronDocument.getStringId();

    /* rowId is the document row */
    const rowId = oid + '0';
    const dataNode = this.gridApi.getRowNode(rowId);

    /* Update the row numbers */
    this.updateRowNumbers(dataNode.data.rowNumber, false);

    /* Update this.hadronDocs */
    for (let i = 0; i < this.hadronDocs.length; i++) {
      if (this.hadronDocs[i].getStringId() === node.data.hadronDocument.getStringId()) {
        this.hadronDocs.splice(i, 1);
        break;
      }
    }

    /* Remove the footer */
    this.removeFooter(node);

    /* Update the headers */
    for (const element of node.data.hadronDocument.elements) {
      Actions.elementRemoved(element.currentKey, oid, false);
    }

    /* Update the toolbar */
    Actions.documentRemoved();

    /* Update the grid */
    this.gridApi.updateRowData({remove: [dataNode.data]});
  }

  /**
   * A row has been updated successfully. We need to set the data to the new
   * values and redraw that row.
   *
   * @param {Object} data - The new data of the row that has been updated.
   */
  handleUpdate(data) {
    const rowId = data._id + '0';
    const dataNode = this.gridApi.getRowNode(rowId);
    const rowNumber = dataNode.data.rowNumber;

    const newData = {
      hadronDocument: new HadronDocument(data),
      isFooter: false,
      hasFooter: false,
      state: null,
      rowNumber: rowNumber
    };

    /* Update this.hadronDocs */
    for (let i = 0; i < this.hadronDocs.length; i++) {
      if (this.hadronDocs[i].getStringId() === newData.hadronDocument.getStringId()) {
        this.hadronDocs[i] = newData.hadronDocument;
        break;
      }
    }

    dataNode.setData(newData);
    this.gridApi.redrawRows({rowNodes: [dataNode]});

    const footerRowId = data._id + '1';
    const footerNode = this.gridApi.getRowNode(footerRowId);
    this.removeFooter(footerNode);

    Actions.cleanCols();
  }

  /**
   * Add a column to the grid to the right of the column with colId.
   *
   * @param {String} colIdBefore - The new column will be inserted after the column
   * with colId.
   * @param {String} headerName - The field of a new column from insert document dialog
   * @param {String} colType - The type of a new column from document insert dialog
   * @param {Array} path - The series of field names. Empty at top-level.
   * @param {HadronDocument} updateArray - If we need to update the array element
   * headers because of an insert.
   */
  addGridColumn(colIdBefore, headerName, colType, path, updateArray) {
    const columnHeaders = _.map(this.columnApi.getAllGridColumns(), function(col) {
      return col.getColDef();
    });

    let i = 0;
    while (i < columnHeaders.length) {
      if (!updateArray && '' + columnHeaders[i].colId === '' + headerName) {
        return;
      }
      i++;
    }

    i = 0;
    while (i < columnHeaders.length) {
      if ('' + columnHeaders[i].colId === '' + colIdBefore) {
        if (updateArray) {
          let j = i + 1;
          while (j < columnHeaders.length) {
            if (!(columnHeaders[j].colId.toString().includes('$'))) {
              const newId = columnHeaders[j].colId + 1;
              columnHeaders[j].colId = newId;
              columnHeaders[j].headerName = newId;
              columnHeaders[j].valueGetter = function(params) {
                return params.data.hadronDocument.getChild([].concat(path, [newId]));
              };
              /* The bsonType is updated from the GridStore */
            }
            j++;
          }
        }
        break;
      }
      i++;
    }

    // Newly added columns are always editable.
    const newColDef = this.createColumnHeader(colType, true, [].concat(path, [headerName]));
    columnHeaders.splice(i + 1, 0, newColDef);

    this.gridApi.setColumnDefs(columnHeaders);
    if (updateArray) {
      this.gridApi.refreshCells({force: true});
    }
  }

  /**
   * Remove a list of columns from the grid.
   *
   * @param {Array} colIds - The list of colIds that will be removed.
   */
  removeColumns(colIds) {
    const columnHeaders = _.map(this.columnApi.getAllGridColumns(), function(col) {
      return col.getColDef();
    });

    const newCols = [];
    for (let i = 0; i < columnHeaders.length; i++) {
      if (!colIds.includes('' + columnHeaders[i].colId) &&
          !colIds.includes(columnHeaders[i].colId)) {
        newCols.push(columnHeaders[i]);
      }
    }
    this.gridApi.setColumnDefs(newCols);
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
      if (colIds.includes('' + columnHeaders[i].colId)) {
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
   *    params.add.colIdBefore - The columnId that the new column will be added next to.
   *    params.add.path - An array of field names. Will be empty for top level.
   *    params.add.newColId - Either $new or the index if it is an array element.
   *    params.add.isArray - If we're adding to an array view.
   *    params.add.colType - The type of the column that we're adding, if we know.
   *   Deleting columns:
   *    params.remove.colIds - The array of columnIds to be deleted.
   *   Updating headers:
   *    params.updateHeaders.showing - A mapping of columnId to BSON type. The
   *      new bson type will be forwarded to the column headers.
   *   Refreshing:
   *    params.refresh.oid - The OID string of the row to redraw.
   *   Editing:
   *    params.edit.rowIndex - The index of row of the cell to start editing.
   *    params.edit.colId - The colId of the cell to start editing.
   */
  modifyColumns(params) {
    if ('add' in params) {
      this.addGridColumn(
        params.add.colIdBefore, params.add.newColId, params.add.colType,
        params.add.path, params.add.isArray
      );
    }
    if ('remove' in params) {
      this.removeColumns(params.remove.colIds);
    }
    if ('updateHeaders' in params) {
      const columnHeaders = _.map(this.columnApi.getAllGridColumns(), function(col) {
        return col.getColDef();
      });

      this.updateHeaders(params.updateHeaders.showing, columnHeaders);
      this.gridApi.refreshHeader();
    }
    if ('refresh' in params) {
      const node = this.gridApi.getRowNode(params.refresh.oid + '0');
      this.gridApi.refreshCells({rowNodes: [node], force: true});
    }
    if ('edit' in params) {
      this.gridApi.setFocusedCell(params.edit.rowIndex, params.edit.colId);
      this.gridApi.startEditingCell({rowIndex: params.edit.rowIndex, colKey: params.edit.colId});
    }
  }

  /**
   * A row has been inserted or deleted and we need to update the row numbers.
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
   * Insert a document row into the grid. If the row is added because a document
   * has been added using the insert document modal, then we don't open it in
   * edit mode. If it is added because a document has been cloned, then we need
   * to open it in edit mode.
   *
   * @param {Object} doc - The new document to be added.
   * @param {Number} index - The AG-Grid row index (counting footers)
   * @param {Number} lineNumber - The line number to be shown for the document (not including footers)
   * @param {boolean} edit - If the new row should be opened in editing mode.
   */
  insertRow(doc, index, lineNumber, edit) {
    /* Create the new data */
    const data = {
      hadronDocument: new HadronDocument(doc),
      isFooter: false,
      hasFooter: false,
      state: edit ? 'cloned' : null,
      rowNumber: lineNumber
    };

    /* Update this.hadronDocs */
    this.hadronDocs.splice(index, 0, data.hadronDocument);

    if (this.topLevel) {
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
      Object.keys(doc).forEach((key) => {
        this.addGridColumn(null, key, TypeChecker.type(doc[key]), [], false);
      });
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
   * Also need to call pathChanged because going to a new page resets the path.
   *
   * @param {Object} error - Error when trying to load more documents.
   * @param {Array} documents - The next batch of documents.
   * @param {Number} start - The index of the first document shown.
   * @param {Number} end - (Unused) The index of the last document shown.
   */
  handlePageChange(error, documents, start) {
    if (!error) {
      this.hadronDocs = this.initHadronDocs(documents);
      this.start = start;
      Actions.pathChanged([], []);
    }
  }

  /**
   * When the ResetDocumentListStore is triggered with new documents.
   *
   * @param {Object} error - Error when trying to load more documents.
   * @param {Array} documents - The refreshed batch of documents.
   */
  handleReset(error, documents) {
    if (!error) {
      this.hadronDocs = this.initHadronDocs(documents);
      this.start = 1;
      Actions.pathChanged([], []);
    }
  }

  /**
   * When the BreadcrumbStore changes, update the grid.
   *
   * and just trigger with the path.
   *
   * @param {Object} params - Can contain collection, path, and/or types.
   *  collection {String} - The collection name.
   *  path {Array} - The array of field names/indexes.
   *  types {Array} - The array of types for each segment of the path array.
   *  editParams {Object} - The cell to open for editing, includes colId and rowIndex.
   */
  handleBreadcrumbChange(params) {
    if (params.path.length === 0) {
      this.topLevel = true;

      const headers = this.createColumnHeaders(this.hadronDocs, []);

      this.gridApi.gridOptionsWrapper.gridOptions.context.path = [];
      this.gridApi.setColumnDefs(headers);
      this.gridApi.setRowData(this.createRowData(this.hadronDocs, this.start));
    } else if (params.types[params.types.length - 1] === 'Object' ||
               params.types[params.types.length - 1] === 'Array') {
      this.topLevel = false;

      const headers = this.createColumnHeaders(this.hadronDocs, params.path);
      headers.push(this.createObjectIdHeader());

      this.gridApi.gridOptionsWrapper.gridOptions.context.path = params.path;
      this.gridApi.setRowData(this.createRowData(this.hadronDocs, 1));
      this.gridApi.setColumnDefs(headers);
    }
    this.gridApi.refreshCells({force: true});
    this.updateActionsPlacement();

    if (this.gridApi) {
      this.addFooters();
    }

    /* Use this call to open cell for editing so that we're guaranteed the cell
    has already been created before we start editing it. */
    if (params.editParams) {
      const strColId = '' + params.editParams.colId;
      this.gridApi.ensureColumnVisible(strColId);
      this.gridApi.setFocusedCell(params.editParams.rowIndex, strColId);
      this.gridApi.startEditingCell({rowIndex: params.editParams.rowIndex, colKey: strColId});
    } else if (params.path.length && params.types[params.types.length - 1] === 'Array') {
      this.gridApi.ensureColumnVisible('0');
    }
  }

   /**
    * Set the width of the document footer based on the width of the columns.
    * If there are more columns than can displayed, set the width to 100%.
    * Assigned to the AG-Grid callback getRowStyle.
    *
    * @param {Object} params - AG-Grid params object. This function uses the
    * state of the row in params.node.data.state.
    *
    * @returns {Object} - A CSS style object containing the correct width.
    */
  updateWidth(params) {
    const allColumns = this.columnApi.getAllColumns();
    const tableWidth = document.getElementById('borderLayout_eRootPanel').offsetWidth;
    if (params.node.data.state === 'editing' || params.node.data.state === 'deleting' || params.node.data.state === 'cloned') {
      let width = 30;
      const newColumn = this.columnApi.getColumn('$new');
      for (let i = 0; i < allColumns.length - 2; i++) {
        width = width + 200;
      }
      if (width > tableWidth || newColumn) {
        return {width: '100%'};
      }
      return {width: `${width}px`};
    }
  }

  /**
   * Go through and add modified footers to documents that are edited.
   */
  addFooters() {
    /* Add footers for modified rows */
    this.gridApi.forEachNodeAfterFilterAndSort((node) => {
      if (node.data.hadronDocument.isModified()) {
        this.addFooter(node, node.data, 'editing');
      }
    });
  }

  createObjectIdHeader() {
    return {
      headerName: '_id',
      colId: '$_id',
      cellClass: 'ag-cell-subtable-objectid',
      valueGetter: function(params) {
        return params.data.hadronDocument.get('_id');
      },
      headerComponentFramework: HeaderComponent,
      headerComponentParams: {
        hide: false,
        bsonType: 'ObjectId',
        subtable: true
      },
      cellRendererFramework: CellRenderer,
      cellRendererParams: {
        actions: Actions
      },
      editable: false,
      cellEditorFramework: CellEditor,
      pinned: 'left'
    };
  }

  /**
   * Create a single column header given a field name, a type, and if it's editable.
   * TODO: Use AG-Grid's default column headers.
   *
   * @param {String} type - The type of the column.
   * @param {boolean} isEditable - If the column is read-only.
   * @param {Array} path - The list of path segments, including the key of this
   * column. Will always have at least 1 element.
   *
   * @returns {Object} A column definition for this header.
   */
  createColumnHeader(type, isEditable, path) {
    return {
      headerName: path[path.length - 1],
      colId: path[path.length - 1],
      valueGetter: function(params) {
        return params.data.hadronDocument.getChild(path);
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
      cellRendererParams: {
        actions: Actions
      },

      editable: function(params) {
        if (!isEditable || params.node.data.state === 'deleting') {
          return false;
        } else if (path.length <= 1) {
          return true;
        }
        const parent = params.node.data.hadronDocument.getChild(
          path.slice(0, path.length - 1)
        );
        if (parent.currentType === 'Array' &&
            params.colDef.colId > parent.elements.lastElement.currentKey + 1) {
          return false;
        }
        return true;
      },

      cellEditorFramework: CellEditor,
      cellEditorParams: {
        actions: Actions
      }
    };
  }

  /**
   * Define all the columns in table and their renderer components.
   * First, add the line number column that is pinned to the left.
   * Second, add a column for each of the field names in each of the documents.
   * Third, get the displayed type for the headers of each of the field columns.
   * Last, add the document level actions column that is pinned to the right.
   *
   * @param {Array} hadronDocs - The list of HadronDocuments.
   * @param {Array} path - The list of path segments. Empty when top-level.
   *
   * @returns {object} the ColHeaders, which is a list of colDefs.
   */
  createColumnHeaders(hadronDocs, path) {
    const headers = {};
    const headerTypes = {};
    const isEditable = this.props.isEditable;

    const addHeader = this.createColumnHeader;

    headers.hadronRowNumber = {
      headerName: 'Row',
      field: 'rowNumber',
      colId: '$rowNumber',
      width: 30,
      pinned: 'left',
      headerComponentFramework: HeaderComponent,
      headerComponentParams: {
        hide: true
      },
      cellRendererFramework: RowNumberRenderer
    };

    /* Make column definitions + track type for header components */
    for (let i = 0; i < hadronDocs.length; i++) {
      /* Get the top-level element/document in the view */
      let topLevel = hadronDocs[i];

      if (path.length > 0) {
        topLevel = topLevel.getChild(path);
      }

      if (topLevel === undefined) {
        continue;
      }

      for (const element of topLevel.elements) {
        const key = element.currentKey;
        const type = element.currentType;
        headers[key] = addHeader(type, isEditable, [].concat(path, [key]));

        if (!(key in headerTypes)) {
          headerTypes[key] = {};
        }
        headerTypes[key][hadronDocs[i].getStringId()] = type;
      }
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

    /* Add the invisible pinned column to the right that has the document
       level action buttons */
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
      cellRendererParams: {
        nested: (path.length !== 0)
      },
      editable: false,
      pinned: 'right',
      width: 100
    });

    /* Return the updated column definitions */
    return columnHeaders;
  }

  /**
   * Create data for each document row. Contains a HadronDocument and some
   * metadata.
   *
   * @param {Array} documents - A list of HadronDocuments.
   * @param {Number} index - The index of the first document of the page.
   *
   * @returns {Array} A list of HadronDocument wrappers.
   */
  createRowData(documents, index) {
    return _.map(documents, function(doc, i) {
      return {
        /* The same doc is shared between a document row and it's footer */
        hadronDocument: doc,
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
        <BreadcrumbComponent collection={this.collection} actions={Actions}/>
        {this.AGGrid}
      </div>
    );
  }
}

DocumentTableView.propTypes = {
  docs: PropTypes.array.isRequired,
  isEditable: PropTypes.bool.isRequired,
  ns: PropTypes.string.isRequired
};

DocumentTableView.displayName = 'DocumentTableView';

module.exports = DocumentTableView;
