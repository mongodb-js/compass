import React from 'react';
import PropTypes from 'prop-types';
import HadronDocument from 'hadron-document';
import { DocumentList } from '@mongodb-js/compass-components';

/**
 * The base class.
 */
const BASE = 'document';

/**
 * The contents class.
 */
const CONTENTS = `${BASE}-contents`;

/**
 * The contents class.
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
      expandAll: false
    };

    this.boundHandleCancel = this.handleCancel.bind(this);
    this.boundHandleUpdateSuccess = this.handleUpdateSuccess.bind(this);
    this.boundHandleRemoveSuccess = this.handleRemoveSuccess.bind(this);
  }

  /**
   * Subscribe to the update store on mount.
   */
  componentDidMount() {
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
      if (this.state.editing || this.state.deleting) {
        // If the underlying document changed, that means that the collection
        // contents have been refreshed. In that case, stop editing/deleting.
        setImmediate(() => {
          this.setState({ editing: false, deleting: false });
        });
      }
    }
  }

  /**
   * Unsubscribe from the update store on unmount.
   */
  componentWillUnmount() {
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

  /**
   * Subscribe to the hadron document events.
   *
   * @param {Document} doc - The hadron document.
   */
  subscribeToDocumentEvents(doc) {
    doc.on(HadronDocument.Events.Cancel, this.boundHandleCancel);
    doc.on('remove-success', this.boundHandleRemoveSuccess);
    doc.on('update-success', this.boundHandleUpdateSuccess);
  }

  /**
   * Unsubscribe from the hadron document events.
   *
   * @param {Document} doc - The hadron document.
   */
  unsubscribeFromDocumentEvents(doc) {
    doc.removeListener(HadronDocument.Events.Cancel, this.boundHandleCancel);
    doc.removeListener('remove-success', this.boundHandleRemoveSuccess);
    doc.removeListener('update-success', this.boundHandleUpdateSuccess);
  }

  /**
   * Fires when the document update was successful.
   */
  handleUpdateSuccess() {
    this.setState({ editing: false });
  }

  /**
   * Handle the successful remove.
   */
  handleRemoveSuccess() {
    this.setState({ deleting: false });
  }

  /**
   * Handles canceling edits to the document.
   */
  handleCancel() {
    this.setState({ editing: false, deleting: false, renderSize: INITIAL_FIELD_LIMIT });
  }

  /**
   * Handle copying JSON to clipboard of the document.
   */
  handleCopy() {
    this.props.copyToClipboard(this.props.doc);
  }

  /**
   * Handle cloning of the document.
   */
  handleClone() {
    const clonedDoc = this.props.doc.generateObject({ excludeInternalFields: true });
    this.props.openInsertDocumentDialog(clonedDoc, true);
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
   * Handle the edit click.
   */
  handleEdit() {
    this.setState({ editing: true });
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
    if (this.state.deleting) {
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
        <DocumentList.DocumentActionsGroup
          onEdit={this.handleEdit.bind(this)}
          onCopy={this.handleCopy.bind(this)}
          onRemove={this.handleDelete.bind(this)}
          onClone={this.handleClone.bind(this)}
          onExpand={this.handleExpandAll.bind(this)}
          expanded={this.state.expandAll}
        />
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
    return (
      <DocumentList.Document
        value={this.props.doc}
        visibleFieldsCount={this.state.renderSize}
        expanded={this.state.expandAll}
        editable
        editing={this.state.editing}
        onEditStart={this.handleEdit.bind(this)}
      />
    );
  }

  /**
   * Render the footer component.
   *
   * @returns {Component} The footer component.
   */
  renderFooter() {
    return (
      <DocumentList.DocumentEditActionsFooter
        doc={this.props.doc}
        editing={this.state.editing}
        deleting={this.state.deleting}
        onUpdate={(force) => {
          if (force) {
            this.props.replaceDocument(this.props.doc);
          } else {
            this.props.updateDocument(this.props.doc);
          }
        }}
        onDelete={() => {
          this.props.removeDocument(this.props.doc);
        }}
        onCancel={() => {
          this.handleCancel();
        }}
      />
    );
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
          <div className={ELEMENTS}>
            {this.renderElements()}
          </div>
          {this.renderActions()}
        </div>
        {this.renderFooter()}
      </div>
    );
  }
}

EditableDocument.displayName = 'EditableDocument';

EditableDocument.propTypes = {
  doc: PropTypes.object.isRequired,
  editable: PropTypes.bool,
  removeDocument: PropTypes.func.isRequired,
  replaceDocument: PropTypes.func.isRequired,
  updateDocument: PropTypes.func.isRequired,
  openInsertDocumentDialog: PropTypes.func.isRequired,
  copyToClipboard: PropTypes.func.isRequired
};

export default EditableDocument;
