import React from 'react';
import PropTypes from 'prop-types';
import { DocumentList } from '@mongodb-js/compass-components';

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
    this.boundHandleUpdateSuccess = this.handleUpdateSuccess.bind(this);
    this.boundHandleRemoveSuccess = this.handleRemoveSuccess.bind(this);
  }

  /**
   * Subscribe to the update store on mount.
   */
  componentDidMount() {
    this.doc.on('remove-success', this.boundHandleRemoveSuccess);
    this.doc.on('update-success', this.boundHandleUpdateSuccess);
  }

  /**
   * Unsubscribe from the update store on unmount.
   */
  componentWillUnmount() {
    this.doc.removeListener('remove-success', this.boundHandleRemoveSuccess);
    this.doc.removeListener('update-success', this.boundHandleUpdateSuccess);
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

  handleCancelRemove() {
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

  refresh() {
    return true;
  }

  render() {
    return (
      <DocumentList.DocumentEditActionsFooter
        doc={this.doc}
        editing={this.state.mode === 'editing'}
        deleting={this.state.mode === 'deleting'}
        onUpdate={(force) => {
          this.props.api.stopEditing();
          if (force) {
            this.props.replaceDocument(this.doc);
          } else {
            this.props.updateDocument(this.doc);
          }
        }}
        onDelete={() => {
          this.props.api.stopEditing();
          this.props.removeDocument(this.doc);
        }}
        onCancel={() => {
          if (this.state.mode === 'editing') {
            this.handleCancelUpdate();
          } else {
            this.handleCancelRemove();
          }
        }}
      />
    );
  }
}

FullWidthCellRenderer.propTypes = {
  api: PropTypes.any,
  data: PropTypes.any,
  context: PropTypes.any,
  node: PropTypes.any,
  updateDocument: PropTypes.func.isRequired,
  removeDocument: PropTypes.func.isRequired,
  replaceDocument: PropTypes.func.isRequired,
  replaceDoc: PropTypes.func.isRequired,
  cleanCols: PropTypes.func.isRequired
};

FullWidthCellRenderer.displayName = 'FullWidthCellRenderer';

export default FullWidthCellRenderer;
