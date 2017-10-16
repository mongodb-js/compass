const React = require('react');
const Reflux = require('reflux');
const PropTypes = require('prop-types');

const Actions = require('../../actions');
const DocumentFooter = require('../document-footer');
const RemoveDocumentFooter = require('../remove-document-footer');
const ClonedDocumentFooter = require('../cloned-document-footer');

/**
 * The delete error message.
 */
const DELETE_ERROR = new Error('Cannot delete documents that do not have an _id field.');

/**
 * The custom full-width cell renderer that renders the update/cancel bar
 * in the table view. Can either be a deleting, editing, or cloned footer.
 *
 */
class FullWidthCellRenderer extends React.Component {
  constructor(props) {
    super(props);
    props.api.selectAll();

    this.doc = props.data.hadronDocument;
    this.state = {
      mode: props.data.state
    };

    // Actions need to be scoped to the single document component and not
    // global singletons.
    this.actions = Reflux.createActions([ 'update', 'remove', 'cancelRemove', 'insert' ]);

    // The update store needs to be scoped to a document and not a global
    // singleton.
    this.updateStore = this.createUpdateStore(this.actions);
    this.removeStore = this.createRemoveStore(this.actions);
    this.insertStore = this.createInsertStore(this.actions);
  }

  /**
   * Subscribe to the update store on mount.
   */
  componentDidMount() {
    this.unsubscribeUpdate = this.updateStore.listen(this.handleStoreUpdate.bind(this));
    this.unsubscribeInsert = this.insertStore.listen(this.handleStoreUpdate.bind(this));
    this.unsubscribeRemove = this.removeStore.listen(this.handleStoreRemove.bind(this));
  }

  /**
   * Unsubscribe from the update store on unmount.
   */
  componentWillUnmount() {
    this.unsubscribeUpdate();
    this.unsubscribeRemove();
    this.unsubscribeInsert();
  }

  /**
   * Create the scoped insert store for cloned documents.
   *
   * @param {Action} actions - The component reflux actions.
   *
   * @returns {Store} The scoped store.
   */
  createInsertStore(actions) {
    return Reflux.createStore({

      /**
       * Initialize the store.
       */
      init: function() {
        this.ns = global.hadronApp.appRegistry.getStore('App.NamespaceStore').ns;
        this.listenTo(actions.insert, this.insert);
      },

      /**
       * Insert the document in the database.
       *
       * @param {Object} object - The new document.
       */
      insert: function(object) {
        global.hadronApp.dataService.insertOne(
          this.ns,
          object,
          {},
          (error) => {
            this.handleResult(error, object);
          }
        );
      },

      /**
       * Handle the result from the driver.
       *
       * @param {Error} error - The error.
       * @param {Object} doc - The doc.
       *
       * @returns {Object} The trigger event.
       */
      handleResult: function(error, doc) {
        return (error) ? this.trigger(false, error) : this.trigger(true, doc);
      }
    });
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
   * Handles a trigger from the store.
   *
   * @param {Boolean} success - If the update succeeded.
   * @param {Object} object - The error or document.
   */
  handleStoreUpdate(success, object) {
    if (success) {
      this.handleUpdateSuccess(object);
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
   *
   * @param {Object} doc - The updated document.
   */
  handleUpdateSuccess(doc) {
    for (const element of this.doc.elements) {
      if (!(element.currentKey in doc)) {
        Actions.elementRemoved(element.currentKey, doc._id);
      }
    }
    this.props.context.handleUpdate(doc);
  }

  /**
   * Handle a successful update.
   */
  handleRemoveSuccess() {
    this.props.context.handleRemove(this.props.node);
  }

  handleCancelDelete() {
    this.props.api.stopEditing();
    this.props.context.removeFooter(this.props.node);
  }

  handleCancelUpdate() {
    this.props.api.stopEditing();
    const id = this.doc.getId().toString();
    const removed = [];
    const changed = [];
    const added = [];
    for (const element of this.doc.elements) {
      if (element.isAdded()) {
        added.push(element);
      } else if (element.isRemoved()) {
        removed.push(element);
      } else if (element.isEdited()) {
        changed.push(element);
      }
    }

    /* Cancel should go through undo all the adding/removing/editing that the cell
       has done. We go through and remove all the added elements, and add back all
       the removed elements. */
    for (let i = 0; i < removed.length; i++) {
      Actions.elementAdded(removed[i].currentKey, removed[i].currentType, id);
    }
    for (let i = 0; i < added.length; i++) {
      Actions.elementRemoved(added[i].currentKey, id);
    }
    this.doc.cancel();
    for (let i = 0; i < changed.length; i++) {
      Actions.elementTypeChanged(changed[i].currentKey, changed[i].currentType, id);
    }
    this.props.context.removeFooter(this.props.node);
  }

  handleCancelClone() {
    this.props.context.handleRemove(this.props.node);
  }

  render() {
    if (this.state.mode === 'editing') {
      return (
        <DocumentFooter
          doc={this.doc}
          updateStore={this.updateStore}
          actions={this.actions}
          cancelHandler={this.handleCancelUpdate.bind(this)}
        />
      );
    }
    if (this.state.mode === 'cloned') {
      return (
        <ClonedDocumentFooter
          doc={this.doc}
          insertStore={this.insertStore}
          actions={this.actions}
          cancelHandler={this.handleCancelClone.bind(this)}
        />
      );
    }
    return (
      <RemoveDocumentFooter
        doc={this.doc}
        removeStore={this.removeStore}
        actions={this.actions}
        cancelHandler={this.handleCancelDelete.bind(this)} />
    );
  }

}

FullWidthCellRenderer.propTypes = {
  api: PropTypes.any,
  mode: PropTypes.any,
  data: PropTypes.any,
  context: PropTypes.any,
  node: PropTypes.any
};

FullWidthCellRenderer.displayName = 'FullWidthCellRenderer';

module.exports = FullWidthCellRenderer;
