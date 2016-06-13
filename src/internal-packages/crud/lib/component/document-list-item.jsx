'use strict';

const _ = require('lodash');
const React = require('react');
const ElementFactory = require('hadron-component-registry').ElementFactory;
const HadronDocument = require('hadron-document');
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
            <button type='button' onClick={this.editDocument.bind(this)}>Edit</button>
            <button type='button' onClick={this.deleteDocument.bind(this)}>Delete</button>
          </div>
        </ol>
      </li>
    );
  }

  elements() {
    if (this.state.editing) {
      return this.editableElements(this.state.doc);
    }
    return ElementFactory.elements(this.state.doc);
  }

  editableElements() {
    return _.map(this.state.doc.elements, (element) => {
      return React.createElement(
        EditableElement,
        { key: `${this.state.doc._id}_${element.key}`, element: element }
      );
    });
  }

  editDocument() {
    var doc = new HadronDocument(this.props.doc);
    this.setState({ doc: doc, editing: true });
  }

  deleteDocument() {

  }
}

DocumentListItem.displayName = 'DocumentListItem';

module.exports = DocumentListItem;
