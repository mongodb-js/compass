// const _ = require('lodash');
const PropTypes = require('prop-types');
const React = require('react');
const ObjectId = require('bson').ObjectId;
const { StatusRow } = require('hadron-react-components');
const InsertDocumentDialog = require('./insert-document-dialog');
const DocumentListView = require('./document-list-view');
const DocumentTableView = require('./document-table-view');
const Toolbar = require('./toolbar');

/**
 * Component for the entire document list.
 */
class DocumentList extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    const appRegistry = global.hadronApp.appRegistry;
    this.queryBar = appRegistry.getComponent('Query.QueryBar');
  }

  /**
   * Handles removal of a document from the document list.
   *
   * @param {Object} id - The id of the removed document.
   */
  // handleRemove(id) {
    // const index = _.findIndex(this.props.docs, (doc) => {
      // const _id = doc._id;
      // if (id instanceof ObjectId) {
        // return id.equals(_id);
      // }
      // return _id === id;
    // });

    // this.state.docs.splice(index, 1);
    // this.setState({ docs: this.state.docs });
  // }

  /**
   * Handle opening of the insert dialog.
   */
  handleOpenInsert() {
    this.props.openInsertDocumentDialog({ _id: new ObjectId(), '': '' }, false);
  }

  /**
   * Render the views for the document list.
   *
   * @returns {React.Component} The document list views.
   */
  renderViews() {
    if (this.props.view === 'List') {
      return (<DocumentListView {...this.props} />);
    }
    return (<DocumentTableView {...this.props} />);
  }

  /**
   * Render the list of documents.
   *
   * @returns {React.Component} The list.
   */
  renderContent() {
    if (this.props.error) {
      return (
        <StatusRow style="error">
          {this.props.error.message}
        </StatusRow>
      );
    }
    return (
      <div className="column-container">
        <div className="column main">
          {this.renderViews()}
        </div>
      </div>
    );
  }

  /**
   * Render the document list.
   *
   * @returns {React.Component} The document list.
   */
  render() {
    return (
      <div className="content-container content-container-documents compass-documents">
        <div className="controls-container">
          <this.queryBar buttonLabel="Find" />
          <Toolbar
            readonly={!this.props.isEditable}
            insertHandler={this.handleOpenInsert.bind(this)}
            viewSwitchHandler={this.props.viewChanged}
            activeDocumentView={this.props.view}
            {...this.props} />
        </div>
        {this.renderContent()}
        <InsertDocumentDialog
          closeInsertDocumentDialog={this.props.closeInsertDocumentDialog}
          closeAllMenus={this.props.closeAllMenus}
          insertDocument={this.props.insertDocument}
          {...this.props.insert} />
      </div>
    );
  }
}

DocumentList.displayName = 'DocumentList';

DocumentList.propTypes = {
  pathChanged: PropTypes.func.isRequired,
  viewChanged: PropTypes.func.isRequired,
  documentRemoved: PropTypes.func.isRequired,
  refreshDocuments: PropTypes.func.isRequired,
  getNextPage: PropTypes.func.isRequired,
  getPrevPage: PropTypes.func.isRequired,
  insertDocument: PropTypes.func.isRequired,
  elementAdded: PropTypes.func.isRequired,
  elementRemoved: PropTypes.func.isRequired,
  addColumn: PropTypes.func.isRequired,
  removeColumn: PropTypes.func.isRequired,
  renameColumn: PropTypes.func.isRequired,
  closeInsertDocumentDialog: PropTypes.func.isRequired,
  openInsertDocumentDialog: PropTypes.func.isRequired,
  elementTypeChanged: PropTypes.func.isRequired,
  elementMarkRemoved: PropTypes.func.isRequired,
  drillDown: PropTypes.func.isRequired,
  cleanCols: PropTypes.func.isRequired,
  resetHeaders: PropTypes.func.isRequired,
  replaceDoc: PropTypes.func.isRequired,
  closeAllMenus: PropTypes.func.isRequired,
  insert: PropTypes.object.isRequired,
  view: PropTypes.string.isRequired,
  ns: PropTypes.string.isRequired,
  start: PropTypes.number.isRequired,
  end: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  count: PropTypes.number.isRequired,
  isEditable: PropTypes.bool.isRequired,
  docs: PropTypes.array.isRequired,
  error: PropTypes.object
};

DocumentList.defaultProps = {
  docs: [],
  error: null,
  ns: '',
  view: 'List',
  isEditable: true,
  count: 0,
  start: 0,
  end: 0,
  page: 0,
  insert: {}
};

DocumentList.Document = Document;

module.exports = DocumentList;
