import React from 'react';
import PropTypes from 'prop-types';
import DocumentFooter from 'components/document-footer';
import RemoveDocumentFooter from 'components/remove-document-footer';

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
    if (this.state.mode === 'editing') {
      return (
        <DocumentFooter
          doc={this.doc}
          replaceDocument={this.props.replaceDocument}
          updateDocument={this.props.updateDocument}
          cancelHandler={this.handleCancelUpdate.bind(this)}
          api={this.props.api} />
      );
    }
    if (this.state.mode === 'deleting') {
      return (
        <RemoveDocumentFooter
          doc={this.doc}
          removeDocument={this.props.removeDocument}
          cancelHandler={this.handleCancelRemove.bind(this)}
          api={this.props.api} />
      );
    }
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
