import React from 'react';
import PropTypes from 'prop-types';
import { DocumentList } from '@mongodb-js/compass-components';
import HadronDocument from 'hadron-document';

import { Editor, EditorVariant } from '@mongodb-js/compass-editor';

/**
 * The base class.
 */
const BASE = 'json';

/**
 * The contents class.
 */
const CONTENTS = `${BASE}-contents`;

/**
 * The test id.
 */
const TEST_ID = 'editable-json';

/**
 * Component for a single editable document in a list of json documents.
 */
class EditableJson extends React.Component {
  /**
   * The component constructor.
   *
   * @note: Local json object state is the current doc that's been serialised into an
   * EJSON.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);

    const value = this._getObjectAsString();

    this.state = {
      editing: false,
      deleting: false,
      deleteFinished: false,
      containsErrors: false,
      value,
      initialValue: value,
    };

    this.boundHandleCancel = this.handleCancel.bind(this);
    this.boundHandleUpdateSuccess = this.handleUpdateSuccess.bind(this);
    this.boundHandleRemoveSuccess = this.handleRemoveSuccess.bind(this);
  }

  /**
   * Fold up all nested values when loading editors.
   */
  componentDidMount() {
    this.subscribeToDocumentEvents(this.props.doc);
    if (!this.props.isExpanded) {
      this.editor.getSession().foldAll(2);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.doc !== prevProps.doc) {
      this.unsubscribeFromDocumentEvents(prevProps.doc);
      this.subscribeToDocumentEvents(this.props.doc);
      const newValue = this._getObjectAsString();
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        editing: false,
        deleting: false,
        value: newValue,
        initialValue: newValue,
      });
    }

    if (
      prevState.editing !== this.state.editing &&
      this.state.editing === false &&
      !this.props.isExpanded
    ) {
      this.editor.getSession().foldAll(2);
    }
  }

  componentWillUnmount() {
    this.unsubscribeFromDocumentEvents(this.props.doc);
  }

  _getObjectAsString() {
    return this.props.doc.toEJSON();
  }

  /**
   * Subscribe to the hadron document events.
   *
   * @param {Document} doc - The hadron document.
   */
  subscribeToDocumentEvents(doc) {
    doc.on('remove-success', this.boundHandleRemoveSuccess);
    doc.on('update-success', this.boundHandleUpdateSuccess);
  }

  /**
   * Unsubscribe from the hadron document events.
   *
   * @param {Document} doc - The hadron document.
   */
  unsubscribeFromDocumentEvents(doc) {
    doc.removeListener('remove-success', this.boundHandleRemoveSuccess);
    doc.removeListener('update-success', this.boundHandleUpdateSuccess);
  }

  /**
   * Fires when the document update was successful.
   */
  handleUpdateSuccess() {
    if (this.state.editing) {
      setTimeout(() => {
        this.setState({ editing: false });
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
   * Handle the user clicking the cancel button.
   */
  handleCancel() {
    this.setState({
      editing: false,
      deleting: false,
      value: this._getObjectAsString(),
    });
  }

  /**
   * Handle copying JSON to clipboard of the json document.
   */
  handleCopy() {
    this.props.copyToClipboard(this.props.doc);
  }

  /**
   * Handle cloning of the json document.
   */
  handleClone() {
    const clonedDoc = this.props.doc.generateObject({
      excludeInternalFields: true,
    });
    this.props.openInsertDocumentDialog(clonedDoc, true);
  }

  /**
   * Handles json document deletion.
   */
  handleDelete() {
    this.setState({
      deleting: true,
      editing: false,
    });
  }

  /**
   * Handles canceling a delete.
   */
  handleCancelRemove() {
    this.setState({
      deleting: false,
      deleteFinished: false,
    });
  }

  /**
   * Handle the edit click.
   */
  handleEdit() {
    this.setState({ editing: true });
  }

  /**
   * Handle editor changes when updating the document
   *
   * @param {String} value - changed value of json doc being edited.
   */
  handleOnChange(value) {
    let containsErrors = false;
    try {
      JSON.parse(value);
    } catch {
      containsErrors = true;
    }
    this.setState({ value, containsErrors });
  }

  /**
   * Get the current style of the json document div.
   *
   * @returns {String} The json document class name.
   */
  jsonStyle() {
    let style = BASE;
    if (this.state.editing) {
      style = style.concat(' json-document-is-editing');
    }
    if (this.state.deleting && !this.state.deleteFinished) {
      style = style.concat(' json-document-is-deleting');
    }
    return style;
  }

  /**
   * Render the actions component.
   *
   * @returns {Component} The actions component.
   */
  renderActions() {
    if (this.props.editable) {
      if (!this.state.editing && !this.state.deleting) {
        return (
          <DocumentList.DocumentActionsGroup
            onEdit={!this.props.isTimeSeries && this.handleEdit.bind(this)}
            onCopy={this.handleCopy.bind(this)}
            onRemove={!this.props.isTimeSeries && this.handleDelete.bind(this)}
            onClone={this.handleClone.bind(this)}
          />
        );
      }
    }
  }

  /**
   * Render Parsed and prettified view of json documents
   *
   * @returns {Component} The footer component.
   */
  renderJson() {
    const options = {
      minLines: 2,
      highlightActiveLine: false,
      highlightGutterLine: false,
      showLineNumbers: this.state.editing,
      fixedWidthGutter: false,
      displayIndentGuides: false,
      wrapBehavioursEnabled: true,
      foldStyle: 'markbegin',
    };

    return (
      <div className="json-ace-editor">
        <Editor
          variant={EditorVariant.EJSON}
          text={this.state.value}
          onChangeText={this.handleOnChange.bind(this)}
          options={options}
          readOnly={!this.state.editing}
          onLoad={(editor) => {
            this.editor = editor;
          }}
        />
      </div>
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
        alwaysForceUpdate
        editing={this.state.editing}
        deleting={this.state.deleting}
        modified={this.state.value !== this.state.initialValue}
        containsErrors={this.state.containsErrors}
        onUpdate={() => {
          this.props.doc.apply(HadronDocument.FromEJSON(this.state.value));
          this.props.replaceDocument(this.props.doc);
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
      <div className={this.jsonStyle()} data-testid={TEST_ID}>
        <div className={CONTENTS}>
          {this.renderJson()}
          {this.renderActions()}
        </div>
        {this.renderFooter()}
      </div>
    );
  }
}

EditableJson.displayName = 'EditableJson';

EditableJson.propTypes = {
  doc: PropTypes.object.isRequired,
  editable: PropTypes.bool,
  isTimeSeries: PropTypes.bool,
  removeDocument: PropTypes.func.isRequired,
  replaceDocument: PropTypes.func.isRequired,
  updateDocument: PropTypes.func.isRequired,
  openInsertDocumentDialog: PropTypes.func.isRequired,
  copyToClipboard: PropTypes.func.isRequired,
  isExpanded: PropTypes.bool,
};

export default EditableJson;
