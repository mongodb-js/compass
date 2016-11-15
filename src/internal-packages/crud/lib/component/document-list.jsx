const _ = require('lodash');
const React = require('react');
const uuid = require('node-uuid');
const app = require('ampersand-app');
const Action = require('hadron-action');
const ObjectID = require('bson').ObjectID;
const Document = require('./document');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const ResetDocumentListStore = require('../store/reset-document-list-store');
const LoadMoreDocumentsStore = require('../store/load-more-documents-store');
const RemoveDocumentStore = require('../store/remove-document-store');
const InsertDocumentStore = require('../store/insert-document-store');
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
    this.loading = false;
    this.samplingMessage = app.appRegistry.getComponent('Query.SamplingMessage');
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
    this.state = { docs: [], nextSkip: 0, namespace: NamespaceStore.ns };
    this.queryBar = app.appRegistry.getComponent('Query.QueryBar');
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
  }

  /**
   * Determine if the component should update.
   *
   * @param {Object} nextProps - The next properties.
   * @param {Object} nextState - The next state.
   *
   * @returns {Boolean} If the component should update.
   */
  shouldComponentUpdate(nextProps, nextState) {
    return (nextState.docs.length !== this.state.docs.length) ||
      (nextState.nextSkip !== this.state.nextSkip) ||
      (nextState.loadedCount !== this.state.loadedCount) ||
      (nextState.namespace !== this.state.namespace);
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
    this._node.parentNode.addEventListener(
      SCROLL_EVENT,
      this.handleScroll.bind(this)
    );
  }

  /**
   * Handle the loading of more documents.
   *
   * @param {Array} documents - The next batch of documents.
   */
  handleLoadMore(documents) {
    // If not resetting we append the documents to the existing
    // list and increment the page. The loaded count is incremented
    // by the number of new documents.
    this.setState({
      docs: this.state.docs.concat(this.renderDocuments(documents)),
      nextSkip: (this.state.nextSkip + documents.length),
      loadedCount: (this.state.loadedCount + documents.length)
    });
    this.loading = false;
  }

  /**
   * Handle the reset of the document list.
   *
   * @param {Array} documents - The documents.
   * @param {Integer} count - The count.
   */
  handleReset(documents, count) {
    // If resetting, then we need to go back to page one with
    // the documents as the filter changed. The loaded count and
    // total count are reset here as well.
    this.setState({
      docs: this.renderDocuments(documents),
      nextSkip: documents.length,
      count: count,
      loadedCount: documents.length,
      namespace: NamespaceStore.ns
    });
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
    if (container.scrollTop > (this._node.offsetHeight - this._scrollDelta())) {
      // If we are scrolling downwards, and have hit the distance to initiate a scroll
      // from the end of the list, we will fire the event to load more documents.
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
   */
  handleInsert(success) {
    if (success) {
      this.setState({ count: this.state.count + 1 });
      this.loadMore();
    }
  }

  /**
   * Get the next batch of documents. Will only fire if there are more documents
   * in the collection to load.
   */
  loadMore() {
    if (!this.loading && (this.state.loadedCount < this.state.count)) {
      this.loading = true;
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
   * Get the distance in pixels from the end of the document list to the point when
   * scrolling where we want to load more documents.
   *
   * @returns {Integer} The distance.
   */
  _scrollDelta() {
    if (!this.scrollDelta) {
      this.scrollDelta = this._node.offsetHeight;
    }
    return this.scrollDelta;
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
      return (
        <li className="document-list-item" key={this._key()}>
          <Document doc={doc} key={this._key(doc)} editable={this.CollectionStore.isWritable()} />
        </li>
      );
    });
  }

  /**
   * Render the document list.
   *
   * @returns {React.Component} The document list.
   */
  render() {
    return (
      <div className="header-margin">
        <this.queryBar />
        <this.samplingMessage insertHandler={this.handleOpenInsert.bind(this)} />
        <div className="column-container with-refinebar-and-message">
          <div className="column main">
            <ol className={LIST_CLASS} ref={(c) => this._node = c}>
              {this.state.docs}
              <InsertDocumentDialog />
            </ol>
          </div>
        </div>
      </div>
    );
  }
}

DocumentList.displayName = 'DocumentList';
DocumentList.Document = Document;

module.exports = DocumentList;
