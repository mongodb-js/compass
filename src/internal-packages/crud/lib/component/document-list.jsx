'use strict';

const _ = require('lodash');
const moment = require('moment');
const React = require('react');
const app = require('ampersand-app');
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

/**
 * Component for the entire document list.
 */
class DocumentList extends React.Component {

  /**
   * Fetch the state when the component mounts.
   */
  componentDidMount() {
    DocumentListStore.listen((documents) => {
      this.setState({ docs: documents });
    });
  }

  /**
   * The component constructor.
   */
  constructor(props) {
    super(props);
    this.state = { docs: [] };
  }

  /**
   * Get the document list item components.
   */
  documentListItems() {
    return _.map(this.state.docs, (doc) => {
      return React.createElement(DocumentListItem, { doc: doc, key: doc._id });
    });
  }

  /**
   * Render the document list.
   */
  render() {
    return (
      <ol className={LIST_CLASS}>
        {this.documentListItems()}
      </ol>
    );
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
 * The property class.
 */
const PROPERTY_CLASS = 'document-property';

/**
 * The document field class.
 */
const FIELD_CLASS = 'document-property-key';

/**
 * The document value class.
 */
const VALUE_CLASS = 'document-property-value';

/**
 * General element component.
 */
class Element extends React.Component {

  /**
   * Render a single element in a document.
   */
  render() {
    return (
      <li className={`${PROPERTY_CLASS} ${this.props.type.toLowerCase()}`}>
        <Field field={this.props.field} />
        :
        <div className={VALUE_CLASS} title={this.props.value}>
          {this.props.value}
        </div>
      </li>
    );
  }
}

/**
 * The header class for expandable elements.
 */
const HEADER_CLASS = 'document-property-header';

/**
 * The caret for expanding elements.
 */
const CARET = 'caret';

/**
 * The expanded class name.
 */
const EXPANDED = 'expanded';

/**
 * The expandable label class.
 */
const LABEL_CLASS = 'document-property-type-label';

/**
 * Component for an element that can be expanded.
 */
class ExpandableElement extends React.Component {

  /**
   * Initialize the element.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { expanded: false };
  }

  /**
   * Toggles the expandable aspect of the element.
   */
  toggleExpandable() {
    this.setState({ expanded: !this.state.expanded });
  }

  /**
   * Render an expandable element - array or object.
   */
  render() {
    return (
      <li className={`${this._elementClass()} `}>
        <div className={HEADER_CLASS} onClick={this.toggleExpandable.bind(this)}>
          <div className={CARET}>
          </div>
          <Field field={this.props.field} />
          :
          <div className={LABEL_CLASS}>
            {this.props.label}
          </div>
        </div>
        <ol className={DOCUMENT_CLASS}>
          {elements(this.props.value)}
        </ol>
      </li>
    );
  }

  /**
   * Get the class of the element - varies if the element is expanded or not.
   */
  _elementClass() {
    var typeClass = this.props.type.toLowerCase();
    if (this.state.expanded) {
      return `${PROPERTY_CLASS} ${typeClass} ${EXPANDED}`
    }
    return `${PROPERTY_CLASS} ${typeClass}`;
  }
}

/**
 * The component for the field name.
 */
class Field extends React.Component {

  /**
   * Render the field name for the element.
   */
  render() {
    return (
      <div className={FIELD_CLASS}>
        {this.props.field}
      </div>
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
Element.displayName = 'Element';
ExpandableElement.displayName = 'ExpandableElement';
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
