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
const FullWidthCellRenderer = require('./table-view/full-width-cell-renderer');
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
    this.addEditingFooter = this.addEditingFooter.bind(this);
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
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
  }

  addEditingFooter(rowNode, data, rowIndex) {
    /* Ignore clicks on footers or data rows that already have footers */
    if (data.isFooter || data.hasFooter) {
      return;
    }

    /* Add footer below this row */
    rowNode.data.hasFooter = true;
    const newData = {
      hadronDocument: data.hadronDocument,
      hasFooter: false,
      isFooter: true,
      state: 'editing'
    };
    this.gridApi.updateRowData({add: [newData], addIndex: rowIndex + 1});
  }

  addDeletingFooter(rowNode, data, rowIndex) {
    /* If bar exists and is in editing mode, set to deleting */
    if (data.isFooter) {
      return;
    } else if (data.hasFooter) {
      data.state = 'deleting'; // TODO: need to notify footer row that state has changed (COMPASS-1870)
      return;
    }

    /* Add deleting row below this row */
    rowNode.data.hasFooter = true;
    const newData = {
      hadronDocument: data.hadronDocument,
      hasFooter: false,
      isFooter: true,
      state: 'deleting'
    };
    this.gridApi.updateRowData({add: [newData], addIndex: rowIndex + 1});
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
    console.log("state of row:" + event.data.state);
    this.addEditingFooter(event.node, event.data, event.rowIndex);
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
          editable: function(params) {
            if (!isEditable) {
              return false;
            }
            return params.node.data.hadronDocument.get(key).isValueEditable();
          },
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
      // TODO: Make wrapper object for HadronDocument
      return {
        /* The same doc is shared between a document row and it's footer */
        hadronDocument: new HadronDocument(val),
        /* Is this row an footer row or document row? */
        isFooter: false,
        /* If this is a document row, does it already have a footer? */
        hasFooter: false,
        /* If this is a footer, state is 'editing' or 'deleting' */
        state: null
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
