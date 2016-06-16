'use strict';

const _ = require('lodash');
const React = require('react');
const ElementFactory = require('hadron-component-registry').ElementFactory;
const HadronDocument = require('hadron-document');
const Element = require('hadron-document').Element;
const EditableElement = require('./editable-element');

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
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { doc: props.doc, editing: false };
  }

  /**
   * Render a single document list item.
   */
  render() {
    return (
      <li className={LIST_ITEM_CLASS}>
        <ol className={DOCUMENT_CLASS}>
          <div className='document-elements'>
            {this.elements()}
          </div>
          <div className='document-actions'>
            <button type='button' onClick={this.handleEdit.bind(this)}>Edit</button>
            <button type='button' onClick={this.deleteDocument.bind(this)}>Delete</button>
          </div>
        </ol>
        {this.footer()}
      </li>
    );
  }

  handleAdd() {
    this.setState({});
  }

  handleRemove() {
    this.setState({});
  }

  /**
   * Get the elements for the document. If we are editing, we get editable elements,
   * otherwise the readonly elements are returned.
   *
   * @returns {Array} The elements.
   */
  elements() {
    if (this.state.editing) {
      return this.editableElements(this.state.doc);
    }
    return ElementFactory.elements(this.state.doc);
  }

  /**
   * Get the editable elements.
   *
   * @returns {Array} The editable elements.
   */
  editableElements() {
    return _.map(this.state.doc.elements, (element) => {
      return this.elementComponent(element);
    });
  }

  footer() {

  }

  /**
   * Handle the editing of the document.
   */
  handleEdit() {
    var doc = new HadronDocument(this.props.doc);
    doc.on(Element.Events.Added, this.handleAdd.bind(this));
    doc.on(Element.Events.Removed, this.handleRemove.bind(this));
    this.setState({ doc: doc, editing: true });
  }

  deleteDocument() {

  }

  /**
   * Get the component for the element value.
   *
   * @returns {EditableValue,EditableExpandableElement} The element.
   */
  elementComponent(element) {
    return React.createElement(EditableElement, { key: element.uuid, element: element });
  }
}

DocumentListItem.displayName = 'DocumentListItem';

module.exports = DocumentListItem;
