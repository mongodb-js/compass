const React = require('react');
const PropTypes = require('prop-types');
const Reflux = require('reflux');
const HadronDocument = require('hadron-document');
const Element = require('hadron-document').Element;
const Actions = require('../actions');
const EditableElement = require('./editable-element');
const DocumentActions = require('./document-actions');
const DocumentFooter = require('./document-footer');
const RemoveDocumentFooter = require('./remove-document-footer');

/**
 * The arrow up class.
 */
const ARROW_UP = 'fa fa-arrow-up';

/**
 * The arrow down class.
 */
const ARROW_DOWN = 'fa fa-arrow-down';

/**
 * The base class.
 */
const BASE = 'document';

/**
 * The elements class.
 */
const ELEMENTS = `${BASE}-elements`;

/**
 * The field limit.
 */
const FIELD_LIMIT = 30;

/**
 * The expander class.
 */
const EXPANDER = 'btn btn-default btn-xs';

/**
 * The test id.
 */
const TEST_ID = 'editable-document';

/**
 * The delete error message.
 */
const DELETE_ERROR = new Error('Cannot delete documents that do not have an _id field.');

/**
 * Component for a single editable document in a list of documents.
 */
class EditableDocument extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.doc = EditableDocument.loadDocument(props.doc);
    this.state = {
      editing: false,
      deleting: false,
      deleteFinished: false,
      expandAll: false,
      expanded: false
    };

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
    this.subscribeToDocumentEvents();
  }

  /**
   * Unsubscribe from the udpate store on unmount.
   */
  componentWillUnmount() {
    this.unsubscribeUpdate();
    this.unsubscribeRemove();
    this.unsubscribeFromDocumentEvents();
  }

  /**
   * Load the hadron document for the provided document.
   *
   * @param {Object} doc - The document to load.
   *
   * @returns {HadronDocument} The hadron document.
   */
  static loadDocument(doc) {
    return new HadronDocument(doc);
  }

  subscribeToDocumentEvents() {
    this.unsubscribeFromDocumentEvents();

    if (!this.unsubscribeAdded) {
      this.unsubscribeAdded = this.handleModify.bind(this);
      this.unsubscribeRemoved = this.handleModify.bind(this);
      this.unsubscribeCancel = this.handleCancel.bind(this);
    }

    this.doc.on(Element.Events.Added, this.unsubscribeAdded);
    this.doc.on(Element.Events.Removed, this.unsubscribeRemoved);
    this.doc.on(HadronDocument.Events.Cancel, this.unsubscribeCancel);
  }

  unsubscribeFromDocumentEvents() {
    if (this.unsubscribeAdded) {
      this.doc.removeListener(Element.Events.Added, this.unsubscribeAdded);
      this.doc.removeListener(Element.Events.Removed, this.unsubscribeRemoved);
      this.doc.removeListener(HadronDocument.Events.Cancel, this.unsubscribeCancel);
    }
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
        this.ns = global.hadronApp.appRegistry.getStore('App.NamespaceStore').ns;
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
        // TODO (@thomasr) this does not work for projections
        global.hadronApp.dataService.findOneAndReplace(
          this.ns,
          { _id: object._id },
          object,
          { returnOriginal: false, promoteValues: false },
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
        this.ns = global.hadronApp.appRegistry.getStore('App.NamespaceStore').ns;
        this.listenTo(actions.remove, this.remove);
      },

      /**
       * Remove the document from the collection.
       *
       * @param {Object} object - The object to delete.
       */
      remove: function(object) {
        const id = object.getId();
        if (id) {
          global.hadronApp.dataService.deleteOne(this.ns, { _id: id }, {}, this.handleResult);
        } else {
          this.handleResult(DELETE_ERROR);
        }
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
   * Handle clicking the expand button.
   */
  handleExpandClick() {
    this.setState({ expanded: !this.state.expanded });
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
    this.doc = EditableDocument.loadDocument(doc);
    this.subscribeToDocumentEvents();
    setTimeout(() => {
      this.setState({ editing: false });
    }, 500);
  }

  /**
   * Handle a sucessful update.
   *
   * @param {Object} doc - The updated document.
   */
  handleRemoveSuccess() {
    this.setState({ deleting: false, deleteFinished: true });
    Actions.documentRemoved(this.props.doc._id);
  }

  /**
   * Handles canceling edits to the document.
   */
  handleCancel() {
    this.setState({ editing: false });
  }

  /**
   * Handle cloning of the document.
   */
  handleClone() {
    Actions.openInsertDocumentDialog(this.doc.generateObject(), true);
  }

  /**
   * Handles document deletion.
   */
  handleDelete() {
    this.setState({ editing: false, deleting: true, expanded: true });
  }

  /**
   * Handles canceling a delete.
   */
  handleCancelDelete() {
    this.setState({ deleting: false });
  }

  /**
   * Handle the edit click.
   */
  handleEdit() {
    this.setState({ editing: true, expanded: true });
  }

  /**
   * Handles modification to the document.
   */
  handleModify() {
    this.forceUpdate();
  }

  /**
   * Handle clicking the expand all button.
   */
  handleExpandAll() {
    this.setState({ expandAll: !this.state.expandAll });
  }

  /**
   * Get the current style of the document div.
   *
   * @returns {String} The document class name.
   */
  style() {
    let style = BASE;
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
    if (!this.state.editing && !this.state.deleting) {
      return (
        <DocumentActions
          allExpanded={this.state.expandAll}
          edit={this.handleEdit.bind(this)}
          remove={this.handleDelete.bind(this)}
          clone={this.handleClone.bind(this)}
          expandAll={this.handleExpandAll.bind(this)} />
      );
    }
  }

  /**
   * Get the elements for the document. If we are editing, we get editable elements,
   * otherwise the readonly elements are returned.
   *
   * @returns {Array} The elements.
   */
  renderElements() {
    const components = [];
    let index = 0;
    for (const element of this.doc.elements) {
      components.push((
        <EditableElement
          key={element.uuid}
          element={element}
          indent={0}
          editing={this.state.editing}
          edit={this.handleEdit.bind(this)}
          expandAll={this.state.expandAll}
          rootFieldIndex={this.state.expanded ? 0 : index} />
      ));
      index++;
    }
    return components;
  }

  /**
   * Render the expander bar.
   *
   * @returns {React.Component} The expander bar.
   */
  renderExpansion() {
    if (this.doc.elements.size > FIELD_LIMIT && !this.state.editing && !this.state.deleting) {
      return (
        <button className={EXPANDER} onClick={this.handleExpandClick.bind(this)}>
          <i className={this.renderIconStyle()} aria-hidden="true"></i>
          <span>{this.renderExpansionText()}</span>
        </button>
      );
    }
  }

  /**
   * Render the expansion text.
   *
   * @returns {String} The text.
   */
  renderExpansionText() {
    const extraFields = this.doc.elements.size - FIELD_LIMIT;
    if (this.state.expanded) {
      return `Hide ${extraFields} fields`;
    }
    return `Show ${extraFields} more fields`;
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
          doc={this.doc}
          updateStore={this.updateStore}
          actions={this.actions} />
      );
    } else if (this.state.deleting) {
      return (
        <RemoveDocumentFooter
          doc={this.doc}
          removeStore={this.removeStore}
          actions={this.actions}
          cancelHandler={this.handleCancelDelete.bind(this)} />
      );
    }
  }

  /**
   * Render the style for the expansion icon.
   *
   * @returns {String} The style.
   */
  renderIconStyle() {
    return this.state.expanded ? ARROW_UP : ARROW_DOWN;
  }

  /**
   * Render a single document list item.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={this.style()} data-test-id={TEST_ID}>
        <ol className={ELEMENTS}>
          {this.renderElements()}
          {this.renderExpansion()}
        </ol>
        {this.renderActions()}
        {this.renderFooter()}
      </div>
    );
  }
}

EditableDocument.displayName = 'EditableDocument';

EditableDocument.propTypes = {
  doc: PropTypes.object.isRequired,
  editable: PropTypes.bool,
  expandAll: PropTypes.bool
};

module.exports = EditableDocument;
