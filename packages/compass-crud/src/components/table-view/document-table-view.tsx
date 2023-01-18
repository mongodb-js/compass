import React from 'react';
import PropTypes from 'prop-types';
import type { AgGridReactProps } from 'ag-grid-react';
import { AgGridReact } from 'ag-grid-react';
import { map } from 'lodash';
import type { Document, Element } from 'hadron-document';
import HadronDocument from 'hadron-document';
import mongodbns from 'mongodb-ns';
import BreadcrumbComponent from './breadcrumb';
import CellRenderer from './cell-renderer';
import RowNumberRenderer from './row-number-renderer';
import FullWidthCellRenderer from './full-width-cell-renderer';
import RowActionsRenderer from './row-actions-renderer';
import HeaderComponent from './header-cell-renderer';
import type { DocumentTableRowNode } from './cell-editor';
import CellEditor from './cell-editor';

import './document-table-view.less';
import './ag-grid-dist.css';
import { cx, spacing, withDarkMode } from '@mongodb-js/compass-components';
import type {
  BSONObject,
  CrudActions,
  CrudStore,
  TableState,
} from '../../stores/crud-store';
import type {
  GridActions,
  GridStoreTriggerParams,
  TableHeaderType,
} from '../../stores/grid-store';
import type {
  CellDoubleClickedEvent,
  ColDef,
  ColumnApi,
  GridApi,
  GridCellDef,
  GridReadyEvent,
  RowNode,
  ValueGetterParams,
} from 'ag-grid-community';

const MIXED = 'Mixed' as const;

export type DocumentTableViewProps = {
  addColumn: GridActions['addColumn'];
  cleanCols: GridActions['cleanCols'];
  docs: Document[];
  drillDown: CrudActions['drillDown'];
  elementAdded: GridActions['elementAdded'];
  elementMarkRemoved: GridActions['elementMarkRemoved'];
  elementRemoved: GridActions['elementRemoved'];
  elementTypeChanged: GridActions['elementTypeChanged'];
  error: unknown;
  isEditable: boolean;
  ns: string;
  version: string;
  openInsertDocumentDialog?: CrudActions['openInsertDocumentDialog'];
  pathChanged: (path: (string | number)[], types: TableHeaderType[]) => void;
  removeColumn: GridActions['removeColumn'];
  copyToClipboard: (doc: Document) => void;
  renameColumn: GridActions['renameColumn'];
  replaceDoc: GridActions['replaceDoc'];
  resetColumns: GridActions['resetColumns'];
  removeDocument: CrudActions['removeDocument'];
  replaceDocument: CrudActions['replaceDocument'];
  updateDocument: CrudActions['updateDocument'];
  start: number;
  store: CrudStore;
  table: TableState;
  tz: string;
  className?: string;
  darkMode?: boolean;
};

export type GridContext = {
  path: (string | number)[];
  removeFooter: (node: DocumentTableRowNode) => void;
  handleUpdate: (doc: BSONObject) => void;
  handleRemove: (node: DocumentTableRowNode) => void;
  addFooter: (
    node: DocumentTableRowNode,
    data: DocumentTableRowNode['data'],
    state: 'editing' | 'deleting'
  ) => void;
  handleClone: (data: { hadronDocument: Document }) => void;
};

/**
 * Represents the table view of the documents tab.
 */
class DocumentTableView extends React.Component<DocumentTableViewProps> {
  AGGrid: React.ReactElement;
  collection: string;
  topLevel: boolean;
  // eslint-disable-next-line @typescript-eslint/ban-types
  unsubscribeGridStore?: Function;
  gridApi?: GridApi;
  columnApi?: ColumnApi;

  constructor(props: DocumentTableViewProps) {
    super(props);
    const context: GridContext = {
      addFooter: this.addFooter,
      removeFooter: this.removeFooter,
      handleUpdate: this.handleUpdate,
      handleRemove: this.handleRemove,
      handleClone: this.handleClone,
      path: [],
    };
    const sharedGridProperties: AgGridReactProps = {
      gridOptions: {
        context,
        suppressDragLeaveHidesColumns: true,
        onCellDoubleClicked: this.onCellDoubleClicked.bind(this),
        getRowHeight({ data: { isFooter } }: { data: { isFooter: boolean } }) {
          // deafult row style expects 28, "footer" row with leafygreen
          // components needs to be 38 (minimum button height + padding)
          return isFooter ? 38 : 28;
        },
        getRowStyle: this.updateWidth,
        suppressPreventDefaultOnMouseWheel: true,
        suppressRowTransform: true,
        tabToNextCell: (params) => {
          if (
            !params.previousCellDef ||
            !params.nextCellDef ||
            params.previousCellDef.rowIndex !== params.nextCellDef.rowIndex
          ) {
            return null as unknown as GridCellDef;
          }
          return params.nextCellDef;
        },
      },
      onGridReady: this.onGridReady.bind(this),
      isFullWidthCell: function (rowNode) {
        return rowNode.data.isFooter;
      },
      fullWidthCellRendererFramework: FullWidthCellRenderer,
      fullWidthCellRendererParams: {
        replaceDoc: this.props.replaceDoc,
        cleanCols: this.props.cleanCols,
        removeDocument: this.props.removeDocument,
        replaceDocument: this.props.replaceDocument,
        updateDocument: this.props.updateDocument,
        darkMode: this.props.darkMode,
      },
      getRowNodeId: function (data) {
        const fid = data.isFooter ? '1' : '0';
        return String(data.hadronDocument.getStringId()) + fid;
      },
    };

    this.collection = mongodbns(props.ns).collection;
    this.topLevel = true;

    this.AGGrid = React.createElement(AgGridReact, sharedGridProperties);
  }

  componentDidMount() {
    this.unsubscribeGridStore = this.props.store.gridStore.listen(
      this.modifyColumns,
      this
    );
  }

  componentWillUnmount() {
    this.unsubscribeGridStore?.();
    this.gridApi?.destroy?.();
  }

  componentDidUpdate(prevProps: DocumentTableViewProps) {
    this.handleBreadcrumbChange();

    // @note: Durran: Since all the values are getting passed down as props now
    //   and the components are decoupled from the stores, we need a way to know
    //   if a document was just inserted in order to add it dynamically to the grid.
    if (this.props.docs.length > prevProps.docs.length) {
      this.handleInsert();
    }
  }

  /**
   * Handle cloning of the document.
   */
  handleClone = ({ hadronDocument }: { hadronDocument: Document }) => {
    const clonedDoc = hadronDocument.generateObject({
      excludeInternalFields: true,
    });
    this.props.openInsertDocumentDialog?.(clonedDoc, true);
  };

  /**
   * AG-Grid lifecycle method. This is called when the grid has loaded.
   * @param {Object} params - a reference to the gridAPI and the columnAPI.
   */
  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;

    this.handleBreadcrumbChange();
  }

  /**
   * Callback for when a cell is double clicked.
   *
   * @param {Object} event
   *     node {RowNode} - the RowNode for the row in question
   *     data {*} - the user provided data for the row in question
   */
  onCellDoubleClicked(event: CellDoubleClickedEvent) {
    this.addFooter(event.node, event.data, 'editing');
  }

  /**
   * Add a row to the table that represents the update/cancel footer for the
   * row directly above. The row will be a full-width row that has the same
   * hadron-document as the 'document row' above.
   *
   * @param {RowNode} node - The RowNode for the document row.
   * @param {object} data - The data for the document row.
   * @param {String} state - Either an editing or deleting footer.
   */
  addFooter = (
    node: DocumentTableRowNode,
    data: DocumentTableRowNode['data'],
    state: 'editing' | 'deleting'
  ) => {
    /* Ignore clicks on footers or document rows that already have footers */
    if (!this.props.isEditable || data.isFooter || data.hasFooter) {
      return;
    }

    /* Add footer below this row */
    node.data.hasFooter = true;
    node.data.state = state;
    this.gridApi?.refreshCells({
      rowNodes: [node as RowNode],
      columns: ['$rowActions'],
      force: true,
    });

    const newData = {
      hadronDocument: data.hadronDocument,
      hasFooter: false,
      isFooter: true,
      state: state,
    };
    this.gridApi?.updateRowData({
      add: [newData],
      addIndex: +node.rowIndex + 1,
    });
  };

  /**
   * A row has finished editing and the footer needs to be removed and the state
   * set back to null.
   *
   * @param {RowNode} node - The RowNode of the footer that is being removed.
   */
  removeFooter = (node: DocumentTableRowNode) => {
    if (!this.gridApi) return;
    /* rowId is the document row */
    const rowId = (node.data.hadronDocument.getStringId() as string) + '0';
    const dataNode = this.gridApi.getRowNode(rowId);

    dataNode.data.hasFooter = false;
    dataNode.data.state = null;
    this.gridApi.refreshCells({
      rowNodes: [dataNode],
      columns: ['$rowActions'],
      force: true,
    });
    this.gridApi.clearFocusedCell();
    this.gridApi.updateRowData({ remove: [node.data] });
  };

  /**
   * A row has either been deleted or updated successfully. Deletes both the footer
   * and the document row.
   *
   * @param {RowNode} node - The RowNode of the footer of the document that is being removed.
   */
  handleRemove = (node: DocumentTableRowNode) => {
    const oid = node.data.hadronDocument.getStringId() as string;

    /* rowId is the document row */
    const rowId = oid + '0';
    const dataNode = this.gridApi?.getRowNode(rowId) as DocumentTableRowNode;

    /* Update the row numbers */
    this.updateRowNumbers(dataNode.data.rowNumber, false);

    /* Remove the footer */
    this.removeFooter(node);

    /* Update the headers */
    for (const element of node.data.hadronDocument.elements) {
      this.props.elementRemoved(String(element.currentKey), oid, false);
    }

    /* Update the grid */
    this.gridApi?.updateRowData({ remove: [dataNode.data] });
  };

  /**
   * A row has been updated successfully. We need to set the data to the new
   * values and redraw that row.
   *
   * @param {Object} data - The new data of the row that has been updated.
   */
  handleUpdate = (data: BSONObject) => {
    if (!this.gridApi) return;
    const rowId = String(data._id) + '0';
    const dataNode = this.gridApi.getRowNode(rowId);
    const rowNumber = dataNode.data.rowNumber;

    const newData = {
      hadronDocument: new HadronDocument(data),
      isFooter: false,
      hasFooter: false,
      state: null,
      rowNumber: rowNumber,
    };

    for (let i = 0; i < this.props.docs.length; i++) {
      if (
        this.props.docs[i].getStringId() ===
        newData.hadronDocument.getStringId()
      ) {
        this.props.docs[i] = newData.hadronDocument;
        break;
      }
    }

    dataNode.setData(newData);
    this.gridApi.redrawRows({ rowNodes: [dataNode] });

    const footerRowId = String(data._id) + '1';
    const footerNode = this.gridApi.getRowNode(footerRowId);
    this.removeFooter(footerNode);

    this.props.cleanCols();
  };

  /**
   * Add a column to the grid to the right of the column with colId.
   *
   * @param {String} colIdBefore - The new column will be inserted after the column
   * with colId.
   * @param {String} headerName - The field of a new column from insert document dialog
   * @param {String} colType - The type of a new column from document insert dialog
   * @param {Array} path - The series of field names. Empty at top-level.
   * @param {Boolean} updateArray - If we need to update the array element
   * headers because of an insert.
   */
  addGridColumn(
    colIdBefore: string | null,
    headerName: string,
    colType: TableHeaderType | '',
    path: (string | number)[],
    updateArray?: boolean
  ) {
    if (!this.columnApi) return;
    const columnHeaders = map(this.columnApi.getAllGridColumns(), (col) =>
      col.getColDef()
    );

    let i = 0;
    while (i < columnHeaders.length) {
      if (
        !updateArray &&
        String(columnHeaders[i].colId) === String(headerName)
      ) {
        return;
      }
      i++;
    }

    i = 0;
    while (i < columnHeaders.length) {
      if (String(columnHeaders[i].colId) === String(colIdBefore)) {
        if (updateArray) {
          let j = i + 1;
          while (j < columnHeaders.length) {
            if (!String(columnHeaders[j].colId).includes('$')) {
              const newId = String(columnHeaders[j].colId) + '1';
              columnHeaders[j].colId = newId;
              columnHeaders[j].headerName = newId;
              columnHeaders[j].valueGetter = function (params) {
                return params.data.hadronDocument.getChild([...path, newId]);
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

    const parentType = updateArray ? 'Array' : 'Object';

    // Newly added columns are always editable.
    const newColDef = this.createColumnHeader(
      colType,
      true,
      [...path, headerName],
      parentType
    );
    columnHeaders.splice(i + 1, 0, newColDef);

    this.gridApi?.setColumnDefs(columnHeaders);
    if (updateArray) {
      this.gridApi?.refreshCells({ force: true });
    }
  }

  /**
   * Remove a list of columns from the grid.
   *
   * @param {Array} colIds - The list of colIds that will be removed.
   */
  removeColumns(colIds: string[]) {
    if (!this.columnApi) return;
    const columnHeaders = map(this.columnApi.getAllGridColumns(), (col) =>
      col.getColDef()
    );

    const newCols = [];
    for (let i = 0; i < columnHeaders.length; i++) {
      if (!colIds.includes(String(columnHeaders[i].colId))) {
        newCols.push(columnHeaders[i]);
      }
    }
    this.gridApi?.setColumnDefs(newCols);
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
  updateHeaders = (
    showing: Record<string, TableHeaderType>,
    columnHeaders: ColDef[]
  ) => {
    const colIds = Object.keys(showing);
    for (let i = 0; i < columnHeaders.length; i++) {
      if (colIds.includes(String(columnHeaders[i].colId))) {
        columnHeaders[i].headerComponentParams.bsonType =
          showing[String(columnHeaders[i].colId)];
      }
    }
  };

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
  modifyColumns = (params: GridStoreTriggerParams) => {
    if (!this.columnApi || !this.gridApi) return;
    if (params.add) {
      this.addGridColumn(
        params.add.colIdBefore,
        params.add.newColId,
        params.add.colType,
        params.add.path,
        params.add.isArray
      );
    }
    if (params.remove) {
      this.removeColumns(params.remove.colIds);
    }
    if (params.updateHeaders) {
      const columnHeaders = map(this.columnApi.getAllGridColumns(), (col) =>
        col.getColDef()
      );

      this.updateHeaders(params.updateHeaders.showing, columnHeaders);
      this.gridApi.refreshHeader();
    }
    if (params.refresh) {
      const node = this.gridApi.getRowNode(String(params.refresh.oid) + '0');
      this.gridApi.refreshCells({ rowNodes: [node], force: true });
    }
    if (params.edit) {
      this.gridApi.setFocusedCell(params.edit.rowIndex, params.edit.colId);
      this.gridApi.startEditingCell({
        rowIndex: params.edit.rowIndex,
        colKey: params.edit.colId,
      });
    }
  };

  /**
   * A row has been inserted or deleted and we need to update the row numbers.
   *
   * @param {Number} index - The index where the row was inserted.
   * @param {boolean} insert - If the row has been inserted.
   */
  updateRowNumbers(index: number, insert: boolean) {
    const add = insert ? 1 : -1;
    this.gridApi?.forEachNodeAfterFilterAndSort(function (node) {
      if (!node.data.isFooter && node.data.rowNumber >= index) {
        node.data.rowNumber += add;
      }
    });
    this.gridApi?.refreshCells({ columns: ['$rowNumber'] });
  }

  /**
   * Insert a document row into the grid. If the row is added because a document
   * has been added using the insert document modal, then we don't open it in
   * edit mode.
   *
   * @param {Object} doc - The new document to be added.
   * @param {Number} index - The AG-Grid row index (counting footers)
   * @param {Number} lineNumber - The line number to be shown for the document (not including footers)
   */
  insertRow(doc: Document, index: number, lineNumber: number) {
    /* Create the new data */
    const data = {
      hadronDocument: doc,
      isFooter: false,
      hasFooter: false,
      state: null,
      rowNumber: lineNumber,
    };

    if (this.topLevel) {
      /* Update row numbers */
      this.updateRowNumbers(lineNumber, true);

      /* Update grid API */
      this.gridApi?.updateRowData({ add: [data], addIndex: index });

      /* Update the headers */
      for (const element of data.hadronDocument.elements) {
        this.props.elementAdded(
          String(element.currentKey),
          element.currentType,
          doc.getStringId() as string
        );
      }
    }
  }

  /**
   * Handle insert of a new document.
   */
  handleInsert() {
    if (!this.props.error) {
      const doc = this.props.docs[this.props.docs.length - 1];
      for (const element of doc.elements) {
        this.addGridColumn(
          null,
          String(element.currentKey),
          element.currentType,
          []
        );
      }
    }
  }

  /**
   * When the component is updated, handle any changes to the paths.
   */
  handleBreadcrumbChange() {
    // the state may get an intermediate
    // update before data are ready.
    if (!this.gridApi) {
      return;
    }

    const params = this.props.table;
    if (params.path.length === 0) {
      this.topLevel = true;

      const headers = this.createColumnHeaders([], []);

      (this.gridApi as any).gridOptionsWrapper.gridOptions.context.path = [];
      this.gridApi.setColumnDefs(headers);
      this.gridApi.setRowData(
        this.createRowData(this.props.docs, this.props.start)
      );
    } else if (
      params.types[params.types.length - 1] === 'Object' ||
      params.types[params.types.length - 1] === 'Array'
    ) {
      this.topLevel = false;

      const headers = this.createColumnHeaders(params.path, params.types);
      headers.push(this.createObjectIdHeader());

      if (headers.length <= 3) {
        headers.push(
          this.createPlaceholderHeader(
            params.types[params.types.length - 1] === 'Array',
            params.path
          )
        );
      }

      (this.gridApi as any).gridOptionsWrapper.gridOptions.context.path =
        params.path;
      this.gridApi.setRowData(this.createRowData(this.props.docs, 1));
      this.gridApi.setColumnDefs(headers);
    }
    this.gridApi.refreshCells({ force: true });

    if (this.gridApi) {
      this.addFooters();
    }

    /* Use this call to open cell for editing so that we're guaranteed the cell
    has already been created before we start editing it. */
    if (params.editParams) {
      const strColId = String(params.editParams.colId);
      this.gridApi.ensureColumnVisible(strColId);
      this.gridApi.setFocusedCell(params.editParams.rowIndex, strColId);
      this.gridApi.startEditingCell({
        rowIndex: params.editParams.rowIndex,
        colKey: strColId,
      });
    } else if (
      params.path.length &&
      params.types[params.types.length - 1] === 'Array'
    ) {
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
  updateWidth = (params: { node: DocumentTableRowNode }) => {
    if (!this.columnApi) return;
    const allColumns = this.columnApi.getAllColumns();
    const rootPanel = document.querySelector('.ag-root-wrapper');
    const tableWidth = rootPanel ? (rootPanel as any).offsetWidth : 0;
    if (
      params.node.data.state === 'editing' ||
      params.node.data.state === 'deleting'
    ) {
      let width = 30;
      const newColumn = this.columnApi.getColumn('$new');
      for (let i = 0; i < allColumns.length - 2; i++) {
        width = width + 200;
      }
      if (width > tableWidth || newColumn) {
        return { width: '100%' };
      }
      return { width: `${width}px` };
    }
  };

  /**
   * Go through and add modified footers to documents that are edited.
   */
  addFooters() {
    /* Add footers for modified rows */
    this.gridApi?.forEachNodeAfterFilterAndSort((node) => {
      if (node.data.hadronDocument.isModified()) {
        this.addFooter(node, node.data, 'editing');
      }
    });
  }

  createPlaceholderHeader(isArray: boolean, path: (string | number)[]) {
    const name = isArray ? 0 : '$new';
    const type = isArray ? 'Array' : 'Object';
    return this.createColumnHeader('String', true, [...path, name], type);
  }

  createObjectIdHeader(): ColDef {
    return {
      headerName: '_id',
      colId: '$_id',
      cellClass: 'ag-cell-subtable-objectid',
      valueGetter: function (params: ValueGetterParams) {
        return params.data.hadronDocument.get('_id');
      },
      headerComponentFramework: HeaderComponent,
      headerComponentParams: {
        hide: false,
        bsonType: 'ObjectId',
        subtable: true,
      },
      cellRendererFramework: CellRenderer,
      cellRendererParams: {
        elementAdded: this.props.elementAdded,
        elementRemoved: this.props.elementRemoved,
        elementTypeChanged: this.props.elementTypeChanged,
        drillDown: this.props.drillDown,
        parentType: '',
        tz: this.props.tz,
        darkMode: this.props.darkMode,
      },
      editable: false,
      cellEditorFramework: CellEditor,
      pinned: 'left',
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
   * @param {String} parentType - The type of the sub elements being rendered.
   * Can be either array or object.
   *
   * @returns {Object} A column definition for this header.
   */
  createColumnHeader = (
    type: TableHeaderType | '',
    isEditable: boolean,
    path: (string | number)[],
    parentType: TableHeaderType
  ): ColDef => {
    return {
      headerName: String(path[path.length - 1]),
      colId: String(path[path.length - 1]),
      valueGetter: function (params) {
        const child = params.data.hadronDocument.getChild(path);
        if (path.length <= 1) {
          return child;
        }
        const parent = params.node.data.hadronDocument.getChild(
          path.slice(0, path.length - 1)
        );
        if (parent === undefined) {
          return child;
        }
        /* If we're drilling down into an array, don't get object elements and
           vice versa */
        if (parentType !== parent.currentType) {
          return undefined;
        }
        return child;
      },
      valueSetter: function (params) {
        if (params.oldValue === undefined && params.newValue === undefined) {
          return false;
        }
        return (
          params.newValue.isEdited() ||
          params.newValue.isAdded() ||
          params.newValue.isRemoved()
        );
      },

      headerComponentFramework: HeaderComponent,
      headerComponentParams: {
        hide: false,
        bsonType: type,
      },

      cellRendererFramework: CellRenderer,
      cellRendererParams: {
        elementAdded: this.props.elementAdded,
        elementRemoved: this.props.elementRemoved,
        elementTypeChanged: this.props.elementTypeChanged,
        drillDown: this.props.drillDown,
        parentType: parentType,
        tz: this.props.tz,
        darkMode: this.props.darkMode,
      },

      editable: function (params) {
        if (!isEditable || params.node.data.state === 'deleting') {
          return false;
        } else if (path.length <= 1) {
          return true;
        }
        const parent = params.node.data.hadronDocument.getChild(
          path.slice(0, path.length - 1)
        );
        if (!parent || parent.currentType !== parentType) {
          return false;
        }
        if (
          parent.currentType === 'Array' &&
          params.column.getColId() !== '$_id'
        ) {
          let maxKey = 0;
          if (parent.elements.lastElement) {
            maxKey = +parent.elements.lastElement.currentKey + 1;
          }
          if (+params.column.getColId() > maxKey) {
            return false;
          }
        }
        return true;
      },

      cellEditorFramework: CellEditor,
      cellEditorParams: {
        addColumn: this.props.addColumn,
        removeColumn: this.props.removeColumn,
        renameColumn: this.props.renameColumn,
        elementAdded: this.props.elementAdded,
        elementRemoved: this.props.elementRemoved,
        version: this.props.version,
        elementTypeChanged: this.props.elementTypeChanged,
        elementMarkRemoved: this.props.elementMarkRemoved,
        drillDown: this.props.drillDown,
        tz: this.props.tz,
        darkMode: this.props.darkMode,
      },
    };
  };

  /**
   * Define all the columns in table and their renderer components.
   * First, add the line number column that is pinned to the left.
   * Second, add a column for each of the field names in each of the documents.
   * Third, get the displayed type for the headers of each of the field columns.
   * Last, add the document level actions column that is pinned to the right.
   *
   * @param {Array} path - The list of path segments. Empty when top-level.
   * @param {Array} types - The list of types. If element is not of the correct
   * type, then don't render it.
   *
   * @returns {object} the ColHeaders, which is a list of colDefs.
   */
  createColumnHeaders = (
    path: (string | number)[],
    types: TableHeaderType[]
  ): ColDef[] => {
    const headers: Record<string, ColDef> = {};
    const headerTypes: Record<string, Record<string, TableHeaderType>> = {};
    const isEditable = this.props.isEditable;
    const parentType = types.length ? types[types.length - 1] : 'Object';

    const addHeader = this.createColumnHeader;

    headers.hadronRowNumber = {
      headerName: 'Row',
      field: 'rowNumber',
      colId: '$rowNumber',
      width: 30,
      pinned: 'left',
      headerComponentFramework: HeaderComponent,
      headerComponentParams: {
        hide: true,
      },
      cellRendererFramework: RowNumberRenderer,
    };

    /* Make column definitions + track type for header components */
    for (let i = 0; i < this.props.docs.length; i++) {
      /* Get the top-level element/document in the view */
      let topLevel: Document | Element = this.props.docs[i];

      if (path.length > 0) {
        topLevel = topLevel.getChild(path)!;
        /* Don't render columns if type doesn't match */
        if (!topLevel || topLevel.currentType !== parentType) {
          continue;
        }
      }

      if (topLevel === undefined) {
        continue;
      }

      for (const element of topLevel.elements ?? []) {
        const key = element.currentKey;
        const type = element.currentType;
        headers[key] = addHeader(type, isEditable, [...path, key], parentType);

        if (!(key in headerTypes)) {
          headerTypes[key] = {};
        }
        headerTypes[key][String(this.props.docs[i].getStringId())] = type;
      }
    }

    /* Set header types correctly in GridStore */
    this.props.resetColumns(headerTypes);

    /* Set header types correctly in the column definitions to be passed to
     the grid. This is handled here for the initial header values, and then
     in the GridStore for any subsequent updates. */
    const columnHeaders = Object.values(headers);
    const showing: Record<string, TableHeaderType> = {};

    map(headerTypes, function (oids, key) {
      const colTypes = Object.values(oids);
      let currentType = colTypes[0];
      for (let i = 0; i < colTypes.length; i++) {
        if (currentType !== colTypes[i]) {
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
      valueGetter: function (params) {
        return params.data;
      },

      headerComponentFramework: HeaderComponent,
      headerComponentParams: {
        hide: true,
      },

      cellRendererFramework: RowActionsRenderer,
      cellRendererParams: {
        nested: path.length !== 0,
        isEditable: this.props.isEditable,
        copyToClipboard: this.props.copyToClipboard,
        tz: this.props.tz,
      },
      editable: false,
      pinned: 'right',
      // button group width + padding (8 * 2)
      width: spacing[7] + spacing[3],
    });

    /* Return the updated column definitions */
    return columnHeaders;
  };

  /**
   * Create data for each document row. Contains a HadronDocument and some
   * metadata.
   *
   * @param {Array} documents - A list of HadronDocuments.
   * @param {Number} index - The index of the first document of the page.
   *
   * @returns {Array} A list of HadronDocument wrappers.
   */
  createRowData = (documents: Document[], index: number) => {
    return documents.map((doc, i) => {
      return {
        /* The same doc is shared between a document row and it's footer */
        hadronDocument: doc,
        /* Is this row an footer row or document row? */
        isFooter: false,
        /* If this is a document row, does it already have a footer? */
        hasFooter: false,
        /* If this is a footer, state is 'editing' or 'deleting' */
        state: null,
        /* Add a row number for the first column */
        rowNumber: i + index,
      };
    });
  };

  /**
   * Render the document table view.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div
        className={cx(
          'document-table-view-container',
          this.props.darkMode && 'document-table-view-container-darkmode'
        )}
      >
        <div className={cx('ag-parent', this.props.className)}>
          <BreadcrumbComponent
            collection={this.collection}
            pathChanged={this.props.pathChanged}
            path={this.props.table.path}
            types={this.props.table.types}
          />
          {this.AGGrid}
        </div>
      </div>
    );
  }

  static propTypes = {
    addColumn: PropTypes.func.isRequired,
    cleanCols: PropTypes.func.isRequired,
    docs: PropTypes.array.isRequired,
    drillDown: PropTypes.func.isRequired,
    elementAdded: PropTypes.func.isRequired,
    elementMarkRemoved: PropTypes.func.isRequired,
    elementRemoved: PropTypes.func.isRequired,
    elementTypeChanged: PropTypes.func.isRequired,
    error: PropTypes.object,
    isEditable: PropTypes.bool.isRequired,
    ns: PropTypes.string.isRequired,
    version: PropTypes.string.isRequired,
    openInsertDocumentDialog: PropTypes.func,
    pathChanged: PropTypes.func.isRequired,
    removeColumn: PropTypes.func.isRequired,
    copyToClipboard: PropTypes.func.isRequired,
    renameColumn: PropTypes.func.isRequired,
    replaceDoc: PropTypes.func.isRequired,
    resetColumns: PropTypes.func.isRequired,
    removeDocument: PropTypes.func.isRequired,
    replaceDocument: PropTypes.func.isRequired,
    updateDocument: PropTypes.func.isRequired,
    start: PropTypes.number.isRequired,
    store: PropTypes.object.isRequired as any,
    table: PropTypes.object.isRequired as any,
    tz: PropTypes.string.isRequired,
    className: PropTypes.string,
    darkMode: PropTypes.bool,
  };

  static displayName = 'DocumentTableView';
}

export default withDarkMode(DocumentTableView);
