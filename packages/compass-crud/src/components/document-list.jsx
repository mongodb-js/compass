const _ = require('lodash');
const React = require('react');
const uuid = require('uuid');
const ObjectID = require('bson').ObjectID;
const Action = require('../actions');
const { StatusRow } = require('hadron-react-components');
const ResetDocumentListStore = require('../stores/reset-document-list-store');
const LoadMoreDocumentsStore = require('../stores/load-more-documents-store');
const RemoveDocumentStore = require('../stores/remove-document-store');
const InsertDocumentStore = require('../stores/insert-document-store');
const InsertDocumentDialog = require('./insert-document-dialog');
const Actions = require('../actions');

/* eslint no-return-assign:0 */

/**
 * The full document list container class.
 */
const LIST_CLASS = 'document-list';

/**
 * The scroll event name.
 */
const SCROLL_EVENT = 'scroll';

/**
 * The loading more class.
 */
const LOADING = 'loading-indicator';

/**
 * Loading indicator is loading.
 */
const IS_LOADING = `${LOADING}-is-loading`;

/**
 * The list item test id.
 */
const LIST_ITEM_TEST_ID = 'document-list-item';

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
    this.samplingMessage = appRegistry.getComponent('Query.SamplingMessage');
    this.CollectionStore = appRegistry.getStore('App.CollectionStore');
    this.NamespaceStore = appRegistry.getStore('App.NamespaceStore');
    this.projection = false;
    this.queryBar = appRegistry.getComponent('Query.QueryBar');
    this.QueryChangedStore = appRegistry.getStore('Query.ChangedStore');
    this.Document = appRegistry.getRole('CRUD.Document')[0].component;
    this.state = {
      docs: [],
      nextSkip: 0,
      namespace: this.NamespaceStore.ns,
      loading: false
    };
  }

  /**
   * Fetch the state when the component mounts.
   */
  componentDidMount() {
    this.attachScrollEvent();
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
   * Attach the scroll event to the parent container.
   */
  attachScrollEvent() {
    this._node.parentNode.parentNode.addEventListener(
      SCROLL_EVENT,
      this.handleScroll.bind(this)
    );
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
    this.setState({
      docs: this.state.docs.concat(this.renderDocuments(documents)),
      nextSkip: (this.state.nextSkip + documents.length),
      loadedCount: (this.state.loadedCount + documents.length),
      error: error,
      loading: false
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
      this.setState({
        docs: this.renderDocuments(documents),
        nextSkip: documents.length,
        count: count,
        loadedCount: documents.length,
        namespace: this.NamespaceStore.ns,
        error: error
      });
    }
  }

  /**
   * Handles removal of a document from the document list.
   *
   * @param {Object} id - The id of the removed document.
   */
  handleRemove(id) {
    const index = _.findIndex(this.state.docs, (component) => {
      const _id = component.props.children.props.doc._id;
      if (id instanceof ObjectID) {
        return id.equals(_id);
      }
      return _id === id;
    });
    this.state.docs.splice(index, 1);
    this.setState({
      docs: this.state.docs,
      loadedCount: (this.state.loadedCount - 1),
      nextSkip: (this.state.nextSkip - 1)
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
    Actions.openInsertDocumentDialog({ _id: new ObjectID(), '': '' }, false);
  }

  /**
   * Handle insert of a new document.
   *
   * @param {Boolean} success - If the insert was successful.
   * @param {Object} doc - The raw document that was inserted.
   */
  handleInsert(success, doc) {
    if (success) {
      this.setState({
        docs: this.state.docs.concat(this.renderDocuments([doc])),
        nextSkip: (this.state.nextSkip + 1),
        loadedCount: (this.state.loadedCount + 1),
        count: this.state.count + 1
      });
    }
  }

  handleQueryChanged(state) {
    this.projection = state.project !== null;
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
   * Get the key for a doc.
   *
   * @returns {String} The unique key.
   */
  _key() {
    return uuid.v4();
  }

  /**
   * Get the document list item components.
   *
   * @param {Array} docs - The raw documents.
   *
   * @return {Array} The document list item components.
   */
  renderDocuments(docs) {
    return _.map(docs, (doc) => {
      const editable = !this.CollectionStore.isReadonly() && !this.projection;
      return (
        <li className="document-list-item" data-test-id={LIST_ITEM_TEST_ID} key={this._key()}>
          <this.Document doc={doc} key={this._key()} editable={editable} />
        </li>
      );
    });
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
          <ol className={LIST_CLASS} ref={(c) => this._node = c}>
            {this.state.docs}
            <InsertDocumentDialog />
          </ol>
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
          <this.samplingMessage insertHandler={this.handleOpenInsert.bind(this)} />
        </div>
        {this.renderContent()}
      </div>
    );
  }
}

DocumentList.displayName = 'DocumentList';
DocumentList.Document = Document;

module.exports = DocumentList;
