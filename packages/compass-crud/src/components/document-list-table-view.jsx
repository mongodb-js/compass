const React = require('react');
const PropTypes = require('prop-types');
const BreadcrumbComponent = require('./breadcrumb');
const BreadcrumbStore = require('../stores/breadcrumb-store');
const { StoreConnector } = require('hadron-react-components');
const {AgGridReact} = require('ag-grid-react');

/**
 * Represents the table view of the documents tab.
 */
class DocumentListTableView extends React.Component {
  constructor(props) {
    super(props);
    const appRegistry = global.hadronApp.appRegistry;
    this.NamespaceStore = appRegistry.getStore('App.NamespaceStore');
  }

  constructor(props) {
    super(props);

    this.state = {
      columnDefs: this.createColumnDefs(),
      rowData: this.createRowData()
    };
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;

    this.gridApi.sizeColumnsToFit();
  }

  createColumnDefs() {
    return [
      {headerName: 'Make', field: 'make'},
      {headerName: 'Model', field: 'model'},
      {headerName: 'Price', field: 'price'}
    ];
  }

  createRowData() {
    return [
      {make: 'Toyota', model: 'Celica', price: 35000},
      {make: 'Ford', model: 'Mondeo', price: 32000},
      {make: 'Porsche', model: 'Boxter', price: 72000}
    ];
  }

  /**
   * Render the document table view.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const containerStyle = {
      height: 115,
      width: 500
    };

    return (
      <div>
        <StoreConnector store={BreadcrumbStore}>
          <BreadcrumbComponent/>
        </StoreConnector>
        <div style={containerStyle} className="ag-fresh">
          <AgGridReact
            // properties
            columnDefs={this.state.columnDefs}
            rowData={this.state.rowData}

            // events
            onGridReady={this.onGridReady}/>
        </div>
      </div>);
  }
}

DocumentListTableView.propTypes = {
  docs: PropTypes.array.isRequired,
  isEditable: PropTypes.bool.isRequired
};

DocumentListTableView.displayName = 'DocumentListTableView';

module.exports = DocumentListTableView;
