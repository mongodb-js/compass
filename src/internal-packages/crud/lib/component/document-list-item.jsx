'use strict';

const _ = require('lodash');
const React = require('react');
const ElementFactory = require('hadron-component-registry').ElementFactory;
const DocumentUpdateStore = require('../store/document-update-store');
const HadronDocument = require('hadron-document');
const Element = require('hadron-document').Element;
const EditableElement = require('./editable-element');
const EditFooter = require('./edit-footer');

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
    this.doc = props.doc;
    this.state = { doc: this.doc, editing: false };
  }

  /**
   * Subscribe to the update store on mount.
   */
  componentDidMount() {
    this.unsubscribe = DocumentUpdateStore.listen(this.handleStoreTrigger.bind(this));
  }

  /**
   * Unsubscribe from the udpate store on unmount.
   */
  componentWillUnmount() {
    this.unsubscribe();
  }

  /**
   * Handles a trigger from the store.
   *
   * @param {ObjectId) id - The object id of the document.
   * @param {Boolean} success - If the update succeeded.
   * @param {Error, Document} object - The error or document.
   */
  handleStoreTrigger(id, success, object) {
    if (this.state.editing) {
      if (id === this.doc._id) {
        if (success) {
          this.handleSuccess(object);
        }
      }
    }
  }

  handleSuccess(doc) {
    this.doc = doc;
    this.setState({ doc: doc, editing: false });
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
          {this.renderActions()}
        </ol>
        {this.renderFooter()}
      </li>
    );
  }

  renderActions() {
    if (!this.state.editing) {
      return (
        <div className='document-actions'>
          <button type='button' onClick={this.handleEdit.bind(this)}>Edit</button>
          <button type='button' onClick={this.handleDelete.bind(this)}>Delete</button>
        </div>
      );
    }
  }

  renderFooter() {
    if (this.state.editing) {
      return (
        <EditFooter doc={this.state.doc} />
      );
    }
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

  /**
   * Handle the editing of the document.
   */
  handleEdit() {
    var doc = new HadronDocument(this.doc);
    doc.on(Element.Events.Added, this.handleAdd.bind(this));
    doc.on(Element.Events.Removed, this.handleRemove.bind(this));
    doc.on("Document::Cancel", this.handleCancel.bind(this));
    this.setState({ doc: doc, editing: true });
  }

  handleCancel() {
    this.setState({ doc: this.doc, editing: false });
  }

  handleDelete() {

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
