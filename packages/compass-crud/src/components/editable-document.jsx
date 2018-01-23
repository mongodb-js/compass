const React = require('react');
const PropTypes = require('prop-types');
const Reflux = require('reflux');
const HadronDocument = require('hadron-document');
const Element = require('hadron-document').Element;
const ExpansionBar = require('./expansion-bar');
const EditableElement = require('./editable-element');
const DocumentActions = require('./document-actions');
const DocumentFooter = require('./document-footer');
const RemoveDocumentFooter = require('./remove-document-footer');
const CRUDStore = require('../stores/crud-store');
const clipboard = require('electron').clipboard;

/**
 * The base class.
 */
const BASE = 'document';

/**
 * The contents class.
 */
const CONTENTS = `${BASE}-contents`;

/**
 * The elements class.
 */
const ELEMENTS = `${BASE}-elements`;

/**
 * The initial field limit.
 */
const INITIAL_FIELD_LIMIT = 25;

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
    this.state = {
      renderSize: INITIAL_FIELD_LIMIT,
      editing: false,
      deleting: false,
      deleteFinished: false,
      expandAll: false
    };

    this.boundForceUpdate = this.forceUpdate.bind(this);
    this.boundHandleCancel = this.handleCancel.bind(this);

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
    this.subscribeToDocumentEvents(this.props.doc);
  }

  /**
   * Refreshing the list updates the doc in the props so we should update the
   * document on the instance.
   *
   * @param {Object} prevProps - The previous props.
   */
  componentDidUpdate(prevProps) {
    if (prevProps.doc !== this.props.doc) {
      this.unsubscribeFromDocumentEvents(prevProps.doc);
      this.subscribeToDocumentEvents(this.props.doc);
    }
  }

  /**
   * Unsubscribe from the update store on unmount.
   */
  componentWillUnmount() {
    this.unsubscribeUpdate();
    this.unsubscribeRemove();
    this.unsubscribeFromDocumentEvents(this.props.doc);
  }

  /**
   * Set the render size.
   *
   * @param {Number} newLimit - The new limit.
   */
  setRenderSize(newLimit) {
    this.setState({ renderSize: newLimit });
  }

  subscribeToDocumentEvents(doc) {
    doc.on(Element.Events.Added, this.boundForceUpdate);
    doc.on(Element.Events.Removed, this.boundForceUpdate);
    doc.on(HadronDocument.Events.Cancel, this.boundHandleCancel);
  }

  unsubscribeFromDocumentEvents(doc) {
    doc.removeListener(Element.Events.Added, this.boundForceUpdate);
    doc.removeListener(Element.Events.Removed, this.boundForceUpdate);
    doc.removeListener(HadronDocument.Events.Cancel, this.boundHandleCancel);
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
      init() {
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
      update(object) {
        // TODO (@thomasr) this does not work for projections
        CRUDStore.dataService.findOneAndReplace(
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
      handleResult(error, doc) {
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
          CRUDStore.dataService.deleteOne(this.ns, { _id: id }, {}, this.handleResult);
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
   */
  handleStoreRemove(success) {
    if (success) {
      this.handleRemoveSuccess();
    }
  }

  /**
   * Handle a successful update.
   */
  handleUpdateSuccess() {
    // @todo: Durran: Replace the doc in the store after update.
    // this.doc = EditableDocument.loadDocument(doc);
    // this.subscribeToDocumentEvents();
    setTimeout(() => {
      this.setState({
        editing: false,
        renderSize: INITIAL_FIELD_LIMIT
      });
    }, 500);
  }

  /**
   * Handle a successful update.
   */
  handleRemoveSuccess() {
    this.setState({ deleting: false, deleteFinished: true });
    this.props.documentRemoved(this.props.doc._id);
  }

  /**
   * Handles canceling edits to the document.
   */
  handleCancel() {
    this.setState({ editing: false, renderSize: INITIAL_FIELD_LIMIT });
  }

  /**
   * Handle copying JSON to clipboard of the document.
   */
  handleCopy() {
    const documentJSON = JSON.stringify(this.props.doc.generateObject());
    clipboard.writeText(documentJSON);
  }

  /**
   * Handle cloning of the document.
   */
  handleClone() {
    this.props.openInsertDocumentDialog(this.props.doc.generateObject(), true);
  }

  /**
   * Handles document deletion.
   */
  handleDelete() {
    this.setState({
      deleting: true,
      editing: false,
      renderSize: INITIAL_FIELD_LIMIT
    });
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
    this.setState({
      editing: true
      // renderSize: INITIAL_FIELD_LIMIT
      // Scenario - User has clicked "Show 1000 more fields"
      // (perhaps several times), then enters edit mode
      // (by double-click or the mouse-hover + edit button).
      // TODO: Need a loading spinner here, preserving the user's current state
      // TODO: ... (and focus if they double-clicked on a field to edit it)
      // TODO: ... is probably more valuable than raw performance here.
      // TODO: See COMPASS-1901
    });
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
          copy={this.handleCopy.bind(this)}
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
    for (const element of this.props.doc.elements) {
      components.push((
        <EditableElement
          key={element.uuid}
          element={element}
          indent={0}
          editing={this.state.editing}
          closeAllMenus={this.props.closeAllMenus}
          edit={this.handleEdit.bind(this)}
          expandAll={this.state.expandAll}
        />
      ));
      index++;
      if (index >= this.state.renderSize) {
        break;
      }
    }
    return components;
  }

  /**
   * Render the show/hide fields bar.
   *
   * @returns {React.Component} The expansion bar.
   */
  renderExpansion() {
    const totalSize = this.props.doc.elements.size;
    const props = {
      disableHideButton: false,
      initialSize: INITIAL_FIELD_LIMIT,
      renderSize: this.state.renderSize,
      setRenderSize: this.setRenderSize.bind(this),
      totalSize: totalSize
    };
    if (this.state.editing) {
      // Not sure how to handle case where hide/collapse an edited row,
      // should the update be applied or ignored? So just disable the update.
      props.disableHideButton = true;
      // Performance - Reduce extra fields added per click in edit mode
      props.perClickSize = 100;
    }
    return (
      <ExpansionBar {...props} />
    );
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
          doc={this.props.doc}
          updateStore={this.updateStore}
          actions={this.actions} />
      );
    } else if (this.state.deleting) {
      return (
        <RemoveDocumentFooter
          doc={this.props.doc}
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
      <div className={this.style()} data-test-id={TEST_ID}>
        <div className={CONTENTS}>
          <ol className={ELEMENTS}>
            {this.renderElements()}
          </ol>
          {this.renderExpansion()}
          {this.renderActions()}
        </div>
        {this.renderFooter()}
      </div>
    );
  }
}

EditableDocument.displayName = 'EditableDocument';

EditableDocument.propTypes = {
  closeAllMenus: PropTypes.func.isRequired,
  doc: PropTypes.object.isRequired,
  documentRemoved: PropTypes.func.isRequired,
  editable: PropTypes.bool,
  expandAll: PropTypes.bool,
  openInsertDocumentDialog: PropTypes.func.isRequired
};

module.exports = EditableDocument;
