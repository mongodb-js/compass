const React = require('react');
const Reflux = require('reflux');
const PropTypes = require('prop-types');

const DocumentFooter = require('../document-footer');
const RemoveDocumentFooter = require('../remove-document-footer');

/**
 * The delete error message.
 */
const DELETE_ERROR = new Error('Cannot delete documents that do not have an _id field.');

/**
 * The custom full-width cell renderer that renders the update/cancel bar
 * in the table view. Can either be a deleting or editing footer.
 *
 */
class FullWidthCellRenderer extends React.Component {
  constructor(props) {
    super(props);

    this.doc = props.data.hadronDocument;
    this.state = {
      mode: props.data.state
    };

    // Actions need to be scoped to the single document component and not
    // global singletons.
    this.actions = Reflux.createActions([ 'update', 'remove', 'cancelRemove', 'insert' ]);

    // The update store needs to be scoped to a document and not a global
    // singleton.
    this.updateStore = this.createUpdateStore(this.actions, this.props.dataService);
    this.removeStore = this.createRemoveStore(this.actions, this.props.dataService);
  }

  /**
   * Subscribe to the update store on mount.
   */
  componentDidMount() {
    this.unsubscribeUpdate = this.updateStore.listen(this.handleStoreUpdate.bind(this));
    this.unsubscribeRemove = this.removeStore.listen(this.handleStoreRemove.bind(this));
  }

  /**
   * Unsubscribe from the update store on unmount.
   */
  componentWillUnmount() {
    this.unsubscribeUpdate();
    this.unsubscribeRemove();
  }

  /**
   * Create the scoped update store.
   *
   * @param {Action} actions - The component reflux actions.
   * @param {DataService} dataService
   *
   * @returns {Store} The scoped store.
   */
  createUpdateStore(actions, dataService) {
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
        dataService.findOneAndReplace(
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
   * @param {DataService} dataService
   *
   * @returns {Store} The scoped store.
   */
  createRemoveStore(actions, dataService) {
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
          dataService.deleteOne(this.ns, { _id: id }, {}, this.handleResult);
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
    let check = doc;
    if (this.props.context.path.length) {
      for (let i = 0; i < this.props.context.path.length; i++) {
        check = check[this.props.context.path[i]];
      }
    }
    this.props.replaceDoc(this.doc.getStringId(), '' + doc._id, check);

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
    const id = this.doc.getStringId();

    let parent = this.doc;
    if (this.props.context.path.length) {
      parent = this.doc.getChild(this.props.context.path);
    }

    this.doc.cancel();
    this.props.context.removeFooter(this.props.node);

    if (parent) {
      let newDoc = parent.generateObject();
      if (this.props.context.path.length && parent.elements === null) {
        newDoc = {};
      }
      this.props.replaceDoc(id, id, newDoc);
      this.props.cleanCols();
    }
  }

  handleCancelClone() {
    this.props.api.stopEditing();
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
          api = {this.props.api}
        />
      );
    }
    if (this.state.mode === 'deleting') {
      return (
        <RemoveDocumentFooter
          doc={this.doc}
          removeStore={this.removeStore}
          actions={this.actions}
          cancelHandler={this.handleCancelDelete.bind(this)}
          api = {this.props.api}
        />
      );
    }
  }

}

FullWidthCellRenderer.propTypes = {
  api: PropTypes.any,
  data: PropTypes.any,
  context: PropTypes.any,
  node: PropTypes.any,
  replaceDoc: PropTypes.func.isRequired,
  cleanCols: PropTypes.func.isRequired,
  dataService: PropTypes.any.isRequired
};

FullWidthCellRenderer.displayName = 'FullWidthCellRenderer';

module.exports = FullWidthCellRenderer;
