const _ = require('lodash');
const PropTypes = require('prop-types');
const React = require('react');
const ObjectId = require('bson').ObjectId;
const { StatusRow } = require('hadron-react-components');
const ResetDocumentListStore = require('../stores/reset-document-list-store');
const RemoveDocumentStore = require('../stores/remove-document-store');
const InsertDocumentStore = require('../stores/insert-document-store');
const InsertDocumentDialog = require('./insert-document-dialog');
const PageChangedStore = require('../stores/page-changed-store');
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
    this.CollectionStore = appRegistry.getStore('App.CollectionStore');
    this.queryBar = appRegistry.getComponent('Query.QueryBar');
    this.QueryChangedStore = appRegistry.getStore('Query.ChangedStore');
    this.projection = false;
    this.state = {
      docs: [],
      startIndex: 1
    };
  }

  /**
   * Fetch the state when the component mounts.
   */
  componentDidMount() {
    this.unsubscribeReset = ResetDocumentListStore.listen(this.handleReset.bind(this));
    this.unsubscribePageChanged = PageChangedStore.listen(this.handlePageChanged.bind(this));
    this.unsubscribeRemove = RemoveDocumentStore.listen(this.handleRemove.bind(this));
    this.unsubscribeInsert = InsertDocumentStore.listen(this.handleInsert.bind(this));
    this.unsubscribeQueryStore = this.QueryChangedStore.listen(this.handleQueryChanged.bind(this));
  }

  /**
   * Unsibscribe from the document list store when unmounting.
   */
  componentWillUnmount() {
    this.unsubscribeReset();
    this.unsubscribeRemove();
    this.unsubscribeInsert();
    this.unsubscribePageChanged();
  }

  /**
   * If an error occurs when we press 'next page'
   *
   * @param {Object} error - Error when trying to click next or prev page.
   * @param {Array} documents - The new documents.
   * @param {Number} start - The start index of the document in the page.
   */
  handlePageChanged(error, documents, start) {
    if (error) {
      this.setState({ error: error });
    } else {
      this.props.pathChanged([], []);
      this.setState({ docs: documents, error: error, startIndex: start });
    }
  }

  /**
   * Handle the reset of the document list.
   *
   * @param {Object} error - Error when trying to reset the document list.
   * @param {Array} documents - The documents.
   * @param {Integer} count - The count.
   */
  handleReset(error, documents, count) {
    if (error) {
      this.setState({ error: error });
    } else {
      // If resetting, then we need to go back to page one with
      // the documents as the filter changed. The loaded count and
      // total count are reset here as well.
      this.props.pathChanged([], []);
      this.setState({
        docs: documents,
        count: count,
        error: error,
        startIndex: 1
      });
    }
  }

  /**
   * Handles removal of a document from the document list.
   *
   * @param {Object} id - The id of the removed document.
   */
  handleRemove(id) {
    const index = _.findIndex(this.state.docs, (document) => {
      const _id = document._id;
      if (id instanceof ObjectId) {
        return id.equals(_id);
      }
      return _id === id;
    });
    this.state.docs.splice(index, 1);
    this.setState({ docs: this.state.docs });
  }

  /**
   * Handle opening of the insert dialog.
   */
  handleOpenInsert() {
    this.props.openInsertDocumentDialog({ _id: new ObjectId(), '': '' }, false);
  }

  /**
   * Handle insert of a new document.
   *
   * @param {Error} error - Any error that happened.
   * @param {Object} doc - The raw document that was inserted.
   */
  handleInsert(error, doc) {
    if (!error) {
      const newDocs = [doc].concat(this.state.docs);
      this.setState({
        docs: newDocs,
        count: this.state.count + 1
      });
    }
  }

  handleQueryChanged(state) {
    this.projection = state.project !== null;
  }

  /**
   * Determine if the plugin is editable.
   *
   * @returns {Boolean} If the plugin is editable.
   */
  isEditable() {
    return (
      !this.CollectionStore.isReadonly() &&
      !this.projection &&
      process.env.HADRON_READONLY !== 'true'
    );
  }

  /**
   * Render the views for the document list.
   *
   * @returns {React.Component} The document list views.
   */
  renderViews() {
    const isEditable = this.isEditable();
    if (this.props.view === 'List') {
      return (
        <DocumentListView
          docs={this.state.docs}
          isEditable={isEditable}
          {...this.props} />
      );
    }
    return (
      <DocumentTableView docs={this.state.docs}
                         isEditable={isEditable}
                         ns={this.props.ns}
                         startIndex={this.state.startIndex}
                         {...this.props} />
    );
  }

  /**
   * Render the list of documents.
   *
   * @returns {React.Component} The list.
   */
  renderContent() {
    if (this.state.error) {
      return (
        <StatusRow style="error">
          {this.state.error.message}
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
            readonly={!this.isEditable()}
            insertHandler={this.handleOpenInsert.bind(this)}
            viewSwitchHandler={this.props.viewChanged}
            activeDocumentView={this.props.view}
            {...this.props} />
        </div>
        {this.renderContent()}
        <InsertDocumentDialog {...this.props} />
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
  elementValid: PropTypes.func.isRequired,
  elementInvalid: PropTypes.func.isRequired,
  closeInsertDocumentDialog: PropTypes.func.isRequired,
  openInsertDocumentDialog: PropTypes.func.isRequired,
  elementTypeChanged: PropTypes.func.isRequired,
  elementMarkRemoved: PropTypes.func.isRequired,
  drillDown: PropTypes.func.isRequired,
  cleanCols: PropTypes.func.isRequired,
  resetHeaders: PropTypes.func.isRequired,
  replaceDoc: PropTypes.func.isRequired,
  closeAllMenus: PropTypes.func.isRequired,
  view: PropTypes.string.isRequired,
  ns: PropTypes.string.isRequired
};

DocumentList.defaultProps = {
  ns: '',
  view: 'List'
};

DocumentList.Document = Document;

module.exports = DocumentList;
