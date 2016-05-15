'use strict';

const _ = require('lodash');
const moment = require('moment');
const React = require('react');
const ReactDOM = require('react-dom');
const app = require('ampersand-app');
const component = require('hadron-component-registry');
const Action = require('hadron-action');
const Element = component.Element;
const ExpandableElement = component.ExpandableElement;
const Waypoint = require('react-waypoint');
const TypeChecker = require('../model/type-checker');
const DocumentListStore = require('../store/document-list-store');

/**
 * Get an array of elements for the provided object.
 *
 * @param {Object} object - The object to get the elements from.
 *
 * @returns {Array} An array of element React components.
 */
function elements(object) {
  return _.map(object, (value, field) => {
    var type = TypeChecker.type(value);
    var elementProps = { field: field, value: value, type: type, key: `${object._id}_${field}` };
    return React.createElement(elementComponent(type), elementProps);
  });
}

/**
 * Get the element component for the type.
 *
 * @param {String} type - The type of the value.
 *
 * @returns {React.Component} The component for the type.
 */
function elementComponent(type) {
  return app.componentRegistry.findByRole(`DocumentListItem:Type:${type}`)[0] || Element;
}

/**
 * The full document list container class.
 */
const LIST_CLASS = 'document-list';

const SCROLL_EVENT = 'scroll';

/**
 * Component for the entire document list.
 */
class DocumentList extends React.Component {

  /**
   * Fetch the state when the component mounts.
   */
  componentDidMount() {
    // @todo: Move the DOM node out of the state.
    this.state.node = ReactDOM.findDOMNode(this);
    var containerNode = this.state.node.parentNode;
    containerNode.addEventListener(SCROLL_EVENT, this._handleScroll.bind(this));

    DocumentListStore.listen((documents, reset) => {
      if (reset) {
        // If resetting, then we need to go back to page one with
        // the documents as the filter changed.
        this.setState({ docs: this._documentListItems(documents), currentPage: 1 });
      } else {
        // If not resetting we append the documents to the existing
        // list and increment the page.
        this.setState({
          docs: this.state.docs.concat(this._documentListItems(documents)),
          page: (this.state.currentPage + 1)
        });
      }
    });
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

  _handleScroll(evt) {
    // Check if the number of documents in the collection against the
    // number of documents we have loaded.
    if (evt.srcElement.scrollTop > (this.state.node.offsetHeight / 2)) {
      // MVP: if we are scrolling down, and are about to run out of docs:
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
   * Get the next batch of documents.
   */
  _nextBatch() {
    Action.fetchNextDocuments(this.state.currentPage);
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
          {elements(this.props.doc)}
        </ol>
      </li>
    );
  }
}
/**
 * Component for array types.
 */
class ArrayElement extends React.Component {

  /**
   * Render an array element.
   */
  render() {
    return (
      <ExpandableElement
        elements={elements(this.props.value)}
        field={this.props.field}
        value={this.props.value}
        type={this.props.type}
        label={`${this.props.type}[${this.props.value.length}]`} />
    );
  }
}

/**
 * Component for date types.
 */
class DateElement extends React.Component {

  /**
   * Render a date element.
   */
  render() {
    var date = moment(this.props.value).format('LLL');
    return (
      <Element field={this.props.field} value={date} type={this.props.type} />
    );
  }
}

/**
 * Component for object types.
 */
class ObjectElement extends React.Component {

  /**
   * Render an object element.
   */
  render() {
    return (
      <ExpandableElement
        elements={elements(this.props.value)}
        field={this.props.field}
        value={this.props.value}
        type={this.props.type}
        label={this.props.type} />
    );
  }
}

/**
 * The elipsis constant.
 */
const ELIPSIS = '...';

/**
 * Component for string types.
 */
class StringElement extends React.Component {

  /**
   * Render a string element.
   */
  render() {
    var string = this.props.value.length > 500 ?
      this.props.value.substring(0, 500) + ELIPSIS : this.props.value;
    return (
      <Element field={this.props.field} value={string} type={this.props.type} />
    );
  }
}

/**
 * Set the display names for all components.
 */
ArrayElement.displayName = 'ArrayElement';
DateElement.displayName = 'DateElement';
DocumentList.displayName = 'DocumentList';
DocumentListItem.displayName = 'DocumentListItem';
ObjectElement.displayName = 'ObjectElement';
StringElement.displayName = 'StringElement';

/**
 * Set the child components.
 */
DocumentList.DocumentListItem = DocumentListItem;
DocumentListItem.ArrayElement = ArrayElement;
DocumentListItem.DateElement = DateElement;
DocumentListItem.ObjectElement = ObjectElement;
DocumentListItem.StringElement = StringElement;

module.exports = DocumentList;
