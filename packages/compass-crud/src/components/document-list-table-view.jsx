const React = require('react');
const PropTypes = require('prop-types');
const BreadcrumbComponent = require('./breadcrumb');
const BreadcrumbStore = require('../stores/breadcrumb-store');
const { StoreConnector } = require('hadron-react-components');
const {AgGridReact} = require('ag-grid-react');
const _ = require('lodash');
const HeaderComponent = require('./cell-renderers/header-cell-renderer');
const TypeChecker = require('hadron-type-checker');

const CellRenderer = require('./cell-renderers/cell-renderer');
const HadronDocument = require('hadron-document');

const util = require('util');

/**
 * Represents the table view of the documents tab.
 */
class DocumentListTableView extends React.Component {
  constructor(props) {
    super(props);
    this.createColumnHeaders = this.createColumnHeaders.bind(this);
    this.createRowData = this.createRowData.bind(this);

    this.gridOptions = {
      context: {
        column_width: 150
      }
    };
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
  }

  // onRowClicked(event) {
  //   // console.log('a row was clicked + event=' + util.inspect(event));
  // }
  //
  createColumnHeaders() {
    const headers = {};
    const width = this.gridOptions.context.column_width;
    const isEditable = this.props.isEditable;

    for (let i = 0; i < this.props.docs.length; i++) {
      _.map(this.props.docs[i], function(val, key) {
        headers[key] = {
          headerName: key,
          valueGetter: function(params) {
            return params.data.get(key);
          },
          headerComponentFramework: HeaderComponent,
          // width: width, TODO: prevents horizontal scrolling
          headerComponentParams: {
            bsonType: TypeChecker.type(val)
          },
          cellRendererFramework: CellRenderer,
          cellRendererParams: {
            isEditable: isEditable
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
      return new HadronDocument(val);
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
            onGridReady={this.onGridReady}
            onRowClicked={this.onRowClicked}
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
