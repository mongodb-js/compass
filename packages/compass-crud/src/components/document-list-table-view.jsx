const React = require('react');
const PropTypes = require('prop-types');
const BreadcrumbComponent = require('./breadcrumb');
const BreadcrumbStore = require('../stores/breadcrumb-store');
const { StoreConnector } = require('hadron-react-components');
const {AgGridReact} = require('ag-grid-react');
const _ = require('lodash');
const TypeChecker = require('hadron-type-checker');
const HadronDocument = require('hadron-document');

const CellRenderer = require('./table-view/cell-renderer');
const HeaderComponent = require('./table-view/header-cell-renderer');
const CellEditor = require('./table-view/cell-editor');

const util = require('util');

/**
 * Represents the table view of the documents tab.
 */
class DocumentListTableView extends React.Component {
  constructor(props) {
    super(props);
    this.createColumnHeaders = this.createColumnHeaders.bind(this);
    this.createRowData = this.createRowData.bind(this);
    this.addUpdateBar = this.addUpdateBar.bind(this);
    this.onRowClicked = this.onRowClicked.bind(this);

    this.gridOptions = {
      context: {
        column_width: 150
      },
      onRowClicked: this.onRowClicked,
      onCellClicked: this.onCellClicked.bind(this)
    };
  }

  onGridReady(params) {
    console.log("onGridReady:" + Object.keys(params));
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
  }

  addUpdateBar(rowNode, data, rowIndex, context, updateState) {
    /* Update bar does not already exist */
    if (data.isUpdateRow) {
      // TODO
      console.log("clicking on update bar");
    }
    else if (!data.hasUpdateRow) {
      rowNode.data.hasUpdateRow = true;
      const newData = {
        hadronDocument: data.hadronDocument,
        hasUpdateRow: false,
        isUpdateRow: true
      };
      this.gridApi.updateRowData({add: [newData], addIndex: rowIndex + 1});
    } else {
      // TODO
      console.log("updateBar already present");
    }
  }

  /**
   * @param {Object} event
   *     node: RowNode, // the RowNode for the row in question
   *     data: any, // the user provided data for the row in question
   *     rowIndex: number, // the visible row index for the row in question
   *     rowPinned: string, // either 'top', 'bottom' or undefined / null (if not pinned)
   *     context: any, // bag of attributes, provided by user, see Context
   *     event?: Event // if even was due to browser event (eg click), then this is browser event
   */
  onRowClicked(event) {
    console.log("row clicked: hasUpdateRow=" + event.data.hasUpdateRow + ", isUpdateRow=" + event.data.isUpdateRow);
    this.addUpdateBar(event.node, event.data, event.rowIndex, event.context);
    console.log("row clicked AFTER: hasUpdateRow=" + event.node.data.hasUpdateRow + ", isUpdateRow=" + event.node.data.isUpdateRow);
  }

  /**
   * @param {Object} event
   *    column: Column, // the column for the cell in question
   *    colDef: ColDef, // the column definition for the cell in question
   *    value: any // the value for the cell in question
   */
  onCellClicked(event) {
    // console.log('a cell was clicked + event=');
  }

  createColumnHeaders() {
    const headers = {};
    // const width = this.gridOptions.context.column_width;
    const isEditable = this.props.isEditable;

    for (let i = 0; i < this.props.docs.length; i++) {
      _.map(this.props.docs[i], function(val, key) {
        headers[key] = {
          headerName: key,
          valueGetter: function(params) {
            return params.data.hadronDocument.get(key);
          },
          headerComponentFramework: HeaderComponent,
          // width: width, TODO: prevents horizontal scrolling
          headerComponentParams: {
            bsonType: TypeChecker.type(val)
          },
          cellRendererFramework: CellRenderer,
          cellRendererParams: {
            isEditable: isEditable
          },
          editable: isEditable,
          cellEditorFramework: CellEditor,
          cellEditorParams: {
          }
        };
        // /* Pin the ObjectId to the left */
        // if (key === '_id') {
        //   headers[key].pinned = 'left';
        // }
      });
    }
    return Object.values(headers);
  }

  /**
   * Create Hadron Documents for each row.
   *
   * @returns {Array} A list of HadronDocuments.
   */
  createRowData() {
    return _.map(this.props.docs, function(val) {
      return {
        hadronDocument: new HadronDocument(val),
        hasUpdateRow: false,
        isUpdateRow: false
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

            rowData={this.createRowData()}
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
