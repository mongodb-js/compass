const React = require('react');
const PropTypes = require('prop-types');
const BreadcrumbComponent = require('./breadcrumb');
const BreadcrumbStore = require('../stores/breadcrumb-store');
const { StoreConnector } = require('hadron-react-components');
const {AgGridReact} = require('ag-grid-react');
const _ = require('lodash');
const HeaderComponent = require('./cell-renderers/header-cell-renderer');
const TypeChecker = require('hadron-type-checker');

const RowRenderer = require('./cell-renderers/row-renderer');
// const util = require('util');

/**
 * Represents the table view of the documents tab.
 */
class DocumentListTableView extends React.Component {
  constructor(props) {
    super(props);
    this.createColumnHeaders = this.createColumnHeaders.bind(this);

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

    for (let i = 0; i < this.props.docs.length; i++) {
      _.map(this.props.docs[i], function(val, key) {
        headers[key] = {
          headerName: key,
          field: key,
          headerComponentFramework: HeaderComponent,
          width: width,
          headerComponentParams: {
            bsonType: TypeChecker.type(val)
          }
        };
        /* Pin the ObjectId to the left */
        if (key === '_id') {
          headers[key].pinned = 'left';
        }
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
      height: 1000,
      width: 1200
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
            gridOptions={this.gridOptions}

            isFullWidthCell={()=>{return true;}}
            fullWidthCellRendererFramework={RowRenderer}

            rowData={this.props.docs}
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
