const _ = require('lodash');
const React = require('react');
const ObjectId = require('bson').ObjectId;
const Action = require('../actions');
const { StatusRow } = require('hadron-react-components');
const ResetDocumentListStore = require('../stores/reset-document-list-store');
const LoadMoreDocumentsStore = require('../stores/load-more-documents-store');
const RemoveDocumentStore = require('../stores/remove-document-store');
const InsertDocumentStore = require('../stores/insert-document-store');
const InsertDocumentDialog = require('./insert-document-dialog');
const DocumentListView = require('./document-list-view');
const DocumentListTableView = require('./document-list-table-view');
const Toolbar = require('./toolbar');
const Actions = require('../actions');

/**
 * The loading more class.
 */
const LOADING = 'loading-indicator';

/**
 * Loading indicator is loading.
 */
const IS_LOADING = `${LOADING}-is-loading`;

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
    this.NamespaceStore = appRegistry.getStore('App.NamespaceStore');
    this.queryBar = appRegistry.getComponent('Query.QueryBar');
    this.QueryChangedStore = appRegistry.getStore('Query.ChangedStore');
    this.projection = false;
    this.state = {
      docs: [],
      nextSkip: 0,
      namespace: this.NamespaceStore.ns,
      loading: false,
      activeDocumentView: 'List'
    };
  }

  /**
   * Fetch the state when the component mounts.
   */
  componentDidMount() {
    this.unsubscribeReset = ResetDocumentListStore.listen(this.handleReset.bind(this));
    this.unsubscribeLoadMore = LoadMoreDocumentsStore.listen(this.handleLoadMore.bind(this));
    this.unsubscribeRemove = RemoveDocumentStore.listen(this.handleRemove.bind(this));
    this.unsubscribeInsert = InsertDocumentStore.listen(this.handleInsert.bind(this));
    this.unsubscribeQueryStore = this.QueryChangedStore.listen(this.handleQueryChanged.bind(this));
  }

  /**
   * Unsibscribe from the document list store when unmounting.
   */
  componentWillUnmount() {
    this.unsubscribeReset();
    this.unsubscribeLoadMore();
    this.unsubscribeRemove();
    this.unsubscribeInsert();
  }

  /**
   * Handle the loading of more documents.
   *
   * @param {Object} error - Error when trying to load more documents.
   * @param {Array} documents - The next batch of documents.
   */
  handleLoadMore(error, documents) {
    // If not resetting we append the documents to the existing
    // list and increment the page. The loaded count is incremented
    // by the number of new documents.
    require('marky').mark('DocumentList - Handle load more');
    this.setState({
      docs: this.state.docs.concat(documents),
      nextSkip: (this.state.nextSkip + documents.length),
      loadedCount: (this.state.loadedCount + documents.length),
      error: error,
      loading: false
    }, () => {
      require('marky').stop('DocumentList - Handle load more');
    });
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
      require('marky').mark('DocumentList - Handle reset');
      this.setState({
        docs: documents,
        nextSkip: documents.length,
        count: count,
        loadedCount: documents.length,
        namespace: this.NamespaceStore.ns,
        error: error
      }, () => {
        require('marky').stop('DocumentList - Handle reset');
      });
    }
  }

  /**
   * Handles removal of a document from the document list.
   *
   * @param {Object} id - The id of the removed document.
   */
  handleRemove(id) {
    require('marky').mark('DocumentList - Handle remove');
    const index = _.findIndex(this.state.docs, (document) => {
      const _id = document._id;
      if (id instanceof ObjectId) {
        return id.equals(_id);
      }
      return _id === id;
    });
    this.state.docs.splice(index, 1);
    this.setState({
      docs: this.state.docs,
      loadedCount: (this.state.loadedCount - 1),
      nextSkip: (this.state.nextSkip - 1)
    }, () => {
      require('marky').stop('DocumentList - Handle remove');
    });
  }

  /**
   * Handle the scroll event of the parent container.
   *
   * @param {Event} evt - The scroll event.
   */
  handleScroll(evt) {
    const container = evt.srcElement;
    if (container.scrollTop === (container.scrollHeight - container.offsetHeight)) {
      this.loadMore();
    }
  }

  /**
   * Handle opening of the insert dialog.
   */
  handleOpenInsert() {
    Actions.openInsertDocumentDialog({ _id: new ObjectId(), '': '' }, false);
  }

  /**
   * Handle insert of a new document.
   *
   * @param {Error} error - Any error that happened.
   * @param {Object} doc - The raw document that was inserted.
   */
  handleInsert(error, doc) {
    if (!error) {
      require('marky').mark('DocumentList - Handle insert');
      this.setState({
        docs: this.state.docs.concat([doc]),
        nextSkip: (this.state.nextSkip + 1),
        loadedCount: (this.state.loadedCount + 1),
        count: this.state.count + 1
      }, () => {
        require('marky').stop('DocumentList - Handle insert');
      });
    }
  }

  handleQueryChanged(state) {
    this.projection = state.project !== null;
  }

  handleViewSwitch(view) {
    this.setState({ activeDocumentView: view });
  }

  /**
   * Get the next batch of documents. Will only fire if there are more documents
   * in the collection to load.
   */
  loadMore() {
    if (!this.state.loading && (this.state.loadedCount < this.state.count)) {
      this.setState({ loading: true });
      Action.fetchNextDocuments(this.state.nextSkip);
    }
  }

  /**
   * Render the views for the document list.
   *
   * @returns {React.Component} The document list views.
   */
  renderViews() {
    const isEditable = !this.CollectionStore.isReadonly() && !this.projection;
    if (this.state.activeDocumentView === 'List') {
      return (
        <DocumentListView
          docs={this.state.docs}
          isEditable={isEditable}
          scrollHandler={this.handleScroll.bind(this)} />
      );
    }
    return (
      <DocumentListTableView docs={this.state.docs} isEditable={isEditable} />
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
          <div className={this.state.loading ? `${LOADING} ${IS_LOADING}` : LOADING}>
            <i className="fa fa-circle-o-notch fa-spin" aria-hidden="true"></i>
          </div>
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
            insertHandler={this.handleOpenInsert.bind(this)}
            viewSwitchHandler={this.handleViewSwitch.bind(this)}
            activeDocumentView={this.state.activeDocumentView} />
        </div>
        {this.renderContent()}
        <InsertDocumentDialog />
      </div>
    );
  }
}

DocumentList.displayName = 'DocumentList';
DocumentList.Document = Document;

module.exports = DocumentList;
