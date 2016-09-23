const app = require('ampersand-app');
const React = require('react');
const Reflux = require('reflux');
const ElementFactory = require('hadron-app-registry').ElementFactory;
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const HadronDocument = require('hadron-document');
const Element = require('hadron-document').Element;
const Actions = require('../actions');
const EditableElement = require('./editable-element');
const DocumentActions = require('./document-actions');
const DocumentFooter = require('./document-footer');
const RemoveDocumentFooter = require('./remove-document-footer');
const Hotspot = require('./hotspot');

/**
 * Component for a single document in a list of documents.
 */
class Document extends React.Component {

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
    this.actions = Reflux.createActions([ 'update', 'remove', 'cancelRemove' ]);

    // The update store needs to be scoped to a document and not a global
    // singleton.
    this.updateStore = this.createUpdateStore(this.actions);
    this.removeStore = this.createRemoveStore(this.actions);
  }

  /**
   * Subscribe to the update store on mount.
   */
  componentDidMount() {
    this.unsubscribeUpdate = this.updateStore.listen(this.handleStoreUpdate.bind(this));
    this.unsubscribeRemove = this.removeStore.listen(this.handleStoreRemove.bind(this));
  }

  /**
   * Unsubscribe from the udpate store on unmount.
   */
  componentWillUnmount() {
    this.unsubscribeUpdate();
    this.unsubscribeRemove();
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
       *
       * @todo: Durran: Determine shard key.
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
   * Create the scoped remove store.
   *
   * @param {Action} actions - The component reflux actions.
   *
   * @returns {Store} The scoped store.
   */
  createRemoveStore(actions) {
    return Reflux.createStore({

      /**
       * Initialize the store.
       */
      init: function() {
        this.ns = NamespaceStore.ns;
        this.listenTo(actions.remove, this.remove);
      },

      /**
       * Remove the document from the collection.
       *
       * @param {Object} object - The object to delete.
       */
      remove: function(object) {
        app.dataService.deleteOne(this.ns, { _id: object._id }, {}, this.handleResult);
      },

      /**
       * Handle the result from the driver.
       *
       * @param {Error} error - The error.
       * @param {Object} result - The document.
       *
       * @returns {Object} The trigger event.
       */
      handleResult: function(error, result) {
        return (error) ? this.trigger(false, error) : this.trigger(true, result);
      }
    });
  }

  /**
   * Handles a trigger from the store.
   *
   * @param {Boolean} success - If the update succeeded.
   * @param {Object} object - The error or document.
   */
  handleStoreUpdate(success, object) {
    if (this.state.editing) {
      if (success) {
        this.handleUpdateSuccess(object);
      }
    }
  }

  /**
   * Handles a trigger from the store.
   *
   * @param {Boolean} success - If the update succeeded.
   * @param {Object} object - The error or document.
   */
  handleStoreRemove(success) {
    if (success) {
      this.handleRemoveSuccess();
    }
  }

  /**
   * Handle a sucessful update.
   *
   * @param {Object} doc - The updated document.
   */
  handleUpdateSuccess(doc) {
    this.doc = doc;
    setTimeout(() => {
      this.setState({ doc: doc, editing: false });
    }, 1000);
  }

  /**
   * Handle a sucessful update.
   *
   * @param {Object} doc - The updated document.
   */
  handleRemoveSuccess() {
    this.setState({ deleteFinished: true });
    Actions.documentRemoved(this.doc._id);
  }

  /**
   * Handle the editing of the document.
   */
  handleEdit() {
    const doc = new HadronDocument(this.doc);
    doc.on(Element.Events.Added, this.handleModify.bind(this));
    doc.on(Element.Events.Removed, this.handleModify.bind(this));
    doc.on(HadronDocument.Events.Cancel, this.handleCancel.bind(this));

    this.setState({ doc: doc, editing: true, deleting: false });
  }

  /**
   * Handles canceling edits to the document.
   */
  handleCancel() {
    this.setState({ doc: this.doc, editing: false });
  }

  /**
   * Handle cloning of the document.
   */
  handleClone() {
    Actions.openInsertDocumentDialog(this.doc, true);
  }

  /**
   * Handles document deletion.
   */
  handleDelete() {
    this.setState({ deleting: true });
  }

  /**
   * Handles canceling a delete.
   */
  handleCancelDelete() {
    this.setState({ deleting: false });
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
    if (this.state.editing && this.props.editable) {
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
    const components = [];
    for (const element of this.state.doc.elements) {
      components.push(<EditableElement key={element.uuid} element={element} />);
    }
    components.push(<Hotspot key="hotspot" element={this.state.doc} />);
    return components;
  }

  /**
   * Get the current style of the document div.
   *
   * @returns {String} The document class name.
   */
  style() {
    let style = "document";
    if (this.state.editing) {
      style = style.concat(' document-is-editing');
    }
    if (this.state.deleting && !this.state.deleteFinished) {
      style = style.concat(' document-is-deleting');
    }
    return style;
  }

  /**
   * Render the actions component.
   *
   * @returns {Component} The actions component.
   */
  renderActions() {
    if (this.props.editable && !this.state.editing && !this.state.deleting) {
      return (
        <DocumentActions
          edit={this.handleEdit.bind(this)}
          remove={this.handleDelete.bind(this)}
          clone={this.handleClone.bind(this)} />
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
        <DocumentFooter
          doc={this.state.doc}
          updateStore={this.updateStore}
          actions={this.actions} />
      );
    } else if (this.state.deleting) {
      return (
        <RemoveDocumentFooter
          doc={this.state.doc}
          removeStore={this.removeStore}
          actions={this.actions}
          cancelHandler={this.handleCancelDelete.bind(this)} />
      );
    }
  }

  /**
   * Render a single document list item.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={this.style()}>
        <ol className="document-elements">
          {this.elements()}
        </ol>
        {this.renderActions()}
        {this.renderFooter()}
      </div>
    );
  }
}

Document.displayName = 'Document';

Document.propTypes = {
  doc: React.PropTypes.object.isRequired,
  editable: React.PropTypes.bool
};

module.exports = Document;
