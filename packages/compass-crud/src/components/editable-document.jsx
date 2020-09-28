import React from 'react';
import PropTypes from 'prop-types';
import HadronDocument, { Element } from 'hadron-document';
import ExpansionBar from 'components/expansion-bar';
import EditableElement from 'components/editable-element';
import DocumentActions from 'components/document-actions';
import DocumentFooter from 'components/document-footer';
import RemoveDocumentFooter from 'components/remove-document-footer';

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
    doc.on(Element.Events.Added, this.boundForceUpdate);
    doc.on(Element.Events.Removed, this.boundForceUpdate);
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
    doc.removeListener(Element.Events.Added, this.boundForceUpdate);
    doc.removeListener(Element.Events.Removed, this.boundForceUpdate);
    doc.removeListener(HadronDocument.Events.Cancel, this.boundHandleCancel);
    doc.removeListener('remove-success', this.boundHandleRemoveSuccess);
    doc.removeListener('update-success', this.boundHandleUpdateSuccess);
  }

  /**
   * Fires when the document update was successful.
   */
  handleUpdateSuccess() {
    if (this.state.editing) {
      setTimeout(() => {
        this.setState({ editing: false, renderSize: INITIAL_FIELD_LIMIT });
      }, 500);
    }
  }

  /**
   * Handle the successful remove.
   */
  handleRemoveSuccess() {
    if (this.state.deleting) {
      setTimeout(() => {
        this.setState({ deleting: false, deleteFinished: true });
      }, 500);
    }
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
    this.props.copyToClipboard(this.props.doc);
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
  handleCancelRemove() {
    this.setState({ deleting: false, deleteFinished: false });
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
          tz={this.props.tz}
          indent={0}
          version={this.props.version}
          editing={this.state.editing}
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
          replaceDocument={this.props.replaceDocument}
          updateDocument={this.props.updateDocument} />
      );
    } else if (this.state.deleting) {
      return (
        <RemoveDocumentFooter
          doc={this.props.doc}
          removeDocument={this.props.removeDocument}
          cancelHandler={this.handleCancelRemove.bind(this)} />
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
  doc: PropTypes.object.isRequired,
  removeDocument: PropTypes.func.isRequired,
  replaceDocument: PropTypes.func.isRequired,
  updateDocument: PropTypes.func.isRequired,
  version: PropTypes.string.isRequired,
  editable: PropTypes.bool,
  tz: PropTypes.string,
  expandAll: PropTypes.bool,
  openInsertDocumentDialog: PropTypes.func.isRequired,
  openImportFileDialog: PropTypes.func.isRequired,
  copyToClipboard: PropTypes.func.isRequired
};

export default EditableDocument;
