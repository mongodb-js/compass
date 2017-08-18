const React = require('react');
const PropTypes = require('prop-types');
const BreadcrumbComponent = require('./breadcrumb');
const BreadcrumbStore = require('../stores/breadcrumb-store');
const { StoreConnector } = require('hadron-react-components');
const {AgGridReact} = require('ag-grid-react');
const _ = require('lodash');
const HeaderComponent = require('./cell-renderers/header-cell');
const TypeChecker = require('hadron-type-checker');

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

  createColumnHeaders() {
    const headers = {};

    for (let i = 0; i < this.props.docs.length; i++) {
      _.map(this.props.docs[i], function(val, key) {
        headers[key] = {
          headerName: key,
          field: key,
          headerComponentFramework: HeaderComponent,
          headerComponentParams: {
            bsonType: TypeChecker.type(val)
          }
        };
      });
    }
    return Object.values(headers);
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
            columnDefs={this.createColumnHeaders()}
            rowData={this.props.docs}
            // events
            onGridReady={this.onGridReady}/>
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
