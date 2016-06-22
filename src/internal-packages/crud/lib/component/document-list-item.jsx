'use strict';

const _ = require('lodash');
const app = require('ampersand-app');
const React = require('react');
const Reflux = require('reflux');
const ElementFactory = require('hadron-component-registry').ElementFactory;
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
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

    // Actions need to be scoped to the single document component and not
    // global singletons.
    this.actions = Reflux.createActions([ 'update', 'delete' ]);

    // The update store needs to be scoped to a document and not a global
    // singleton.
    this.updateStore = this.createUpdateStore(this.actions);
  }

  /**
   * Create the scoped update store.
   *
   * @param {Action} actions - The component reflux actions.
   *
   * @returns {Store} The scoped store.
   */
  createUpdateStore(actions) {
    return Reflux.createStore({

      /**
       * Initialize the store.
       */
      init: function() {
        this.ns = NamespaceStore.ns;
        this.listenTo(actions.update, this.update);
      },

      /**
       * Update the document in the database.
       *
       * @param {Object} object - The replacement document.
       */
      update: function(object) {
        app.dataService.findOneAndReplace(
          this.ns,
          { _id: object._id },
          object,
          { returnOriginal: false },
          this.handleResult
        );
      },

      /**
       * Handle the result from the driver.
       *
       * @param {Error} error - The error.
       * @param {Object} doc - The document.
       *
       * @returns {Object} The trigger event.
       */
      handleResult: function(error, doc) {
        return (error) ? this.trigger(false, error) : this.trigger(true, doc);
      }
    });
  }

  /**
   * Subscribe to the update store on mount.
   */
  componentDidMount() {
    this.unsubscribeUpdate = this.updateStore.listen(this.handleStoreUpdate.bind(this));
  }

  /**
   * Unsubscribe from the udpate store on unmount.
   */
  componentWillUnmount() {
    this.unsubscribeUpdate();
  }

  /**
   * Handles a trigger from the store.
   *
   * @param {Boolean} success - If the update succeeded.
   * @param {Error, Document} object - The error or document.
   */
  handleStoreUpdate(success, object) {
    if (this.state.editing) {
      if (success) {
        this.handleSuccess(object);
      }
    }
  }

  /**
   * Handle a sucessful update.
   *
   * @param {Object} doc - The updated document.
   */
  handleSuccess(doc) {
    this.doc = doc;
    this.setState({ doc: doc, editing: false });
  }

  /**
   * Handle the editing of the document.
   */
  handleEdit() {
    var doc = new HadronDocument(this.doc);
    doc.on(Element.Events.Added, this.handleModify.bind(this));
    doc.on(Element.Events.Removed, this.handleModify.bind(this));
    doc.on(HadronDocument.Events.Cancel, this.handleCancel.bind(this));

    this.setState({ doc: doc, editing: true });
  }

  /**
   * Handles canceling edits to the document.
   */
  handleCancel() {
    this.setState({ doc: this.doc, editing: false });
  }

  /**
   * Handles document deletion.
   */
  handleDelete() {

  }

  /**
   * Handles modification to the document.
   */
  handleModify() {
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
      return (
        <EditableElement key={element.uuid} element={element} />
      );
    });
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

  /**
   * Render the actions.
   *
   * @returns {Component} The actions component.
   */
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

  /**
   * Render the footer component.
   *
   * @returns {Component} The footer component.
   */
  renderFooter() {
    if (this.state.editing) {
      return (
        <EditFooter doc={this.state.doc} updateStore={this.updateStore} actions={this.actions} />
      );
    }
  }
}

DocumentListItem.displayName = 'DocumentListItem';

module.exports = DocumentListItem;
