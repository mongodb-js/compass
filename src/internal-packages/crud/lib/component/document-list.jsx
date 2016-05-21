'use strict';

const _ = require('lodash');
const React = require('react');
const ReactDOM = require('react-dom');
const app = require('ampersand-app');
const ElementFactory = require('hadron-component-registry').ElementFactory;
const Action = require('hadron-action');
const DocumentListStore = require('../store/document-list-store');

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
   * Fetch the state when the component mounts.
   */
  componentDidMount() {
    this._attachScrollEvent();
    this.unsubscribe = DocumentListStore.listen((documents, reset, count) => {
      if (reset) {
        // If resetting, then we need to go back to page one with
        // the documents as the filter changed. The loaded count and
        // total count are reset here as well.
        this.setState({
          docs: this._documentListItems(documents),
          currentPage: 1,
          count: count,
          loadedCount: documents.length
        });
      } else {
        // If not resetting we append the documents to the existing
        // list and increment the page. The loaded count is incremented
        // by the number of new documents.
        this.setState({
          docs: this.state.docs.concat(this._documentListItems(documents)),
          currentPage: (this.state.currentPage + 1),
          loadedCount: (this.state.loadedCount + documents.length)
        });
      }
    });
  }

  /**
   * Unsibscribe from the document list store when unmounting.
   */
  componentWillUnmount() {
    this.unsubscribe();
  }

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { docs: [], currentPage: 0 };
  }

  /**
   * Render the document list.
   *
   * @returns {React.Component} The document list.
   */
  render() {
    return (
      <ol className={LIST_CLASS}>
        {this.state.docs}
      </ol>
    );
  }

  /**
   * Attach the scroll event to the parent container.
   */
  _attachScrollEvent() {
    this.documentListNode = ReactDOM.findDOMNode(this);
    this.documentListNode.parentNode.addEventListener(
      SCROLL_EVENT,
      this._handleScroll.bind(this)
    );
  }

  /**
   * Get the document list item components.
   *
   * @param {Array} docs - The raw documents.
   *
   * @return {Array} The document list item components.
   */
  _documentListItems(docs) {
    return _.map(docs, (doc) => {
      return React.createElement(DocumentListItem, { doc: doc, key: doc._id });
    });
  }

  /**
   * Handle the scroll event of the parent container.
   *
   * @param {Event} evt - The scroll event.
   */
  _handleScroll(evt) {
    var container = evt.srcElement;
    if (container.scrollTop > (this.documentListNode.offsetHeight - this._scrollDelta())) {
      // If we are scrolling downwards, and have hit the distance to initiate a scroll
      // from the end of the list, we will fire the event to load more documents.
      this._nextBatch();
    }
    // Bonus: if we have passed a certain number of docs that are out of view:
    // this._unloadPreviousBatch();
    // Bonus: if we are scrolling back up and are running out of previous docs:
    // this._previousBatch();
    // Bonus: if we are scrolling up and docs below are out of view:
    // this._unloadNextBatch();
  }

  /**
   * Get the next batch of documents. Will only fire if there are more documents
   * in the collection to load.
   */
  _nextBatch() {
    if (this.state.loadedCount < this.state.count) {
      Action.fetchNextDocuments(this.state.currentPage);
    }
  }

  /**
   * Get the distance in pixels from the end of the document list to the point when
   * scrolling where we want to load more documents.
   *
   * @returns {Integer} The distance.
   */
  _scrollDelta() {
    if (!this.scrollDelta) {
      this.scrollDelta = this.documentListNode.offsetHeight;
    }
    return this.scrollDelta;
  }
}

/**
 * The class for the document itself.
 */
const DOCUMENT_CLASS = 'document-property-body';

/**
 * The class for the list item wrapper.
 */
const LIST_ITEM_CLASS = 'document-list-item';

/**
 * Component for a single document in a list of documents.
 */
class DocumentListItem extends React.Component {

  /**
   * Render a single document list item.
   */
  render() {
    return (
      <li className={LIST_ITEM_CLASS}>
        <ol className={DOCUMENT_CLASS}>
          {ElementFactory.elements(this.props.doc)}
        </ol>
      </li>
    );
  }
}

/**
 * Set the display names for all components.
 */
DocumentList.displayName = 'DocumentList';
DocumentListItem.displayName = 'DocumentListItem';

/**
 * Set the child components.
 */
DocumentList.DocumentListItem = DocumentListItem;

module.exports = DocumentList;
