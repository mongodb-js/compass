import React from 'react';
import PropTypes from 'prop-types';
import { DocumentList } from '@mongodb-js/compass-components';
import type { Document } from 'hadron-document';
import HadronDocument from 'hadron-document';

import type { AceEditor } from '@mongodb-js/compass-editor';
import { Editor, EditorVariant } from '@mongodb-js/compass-editor';
import type { CrudActions } from '../stores/crud-store';

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

export type EditableJsonProps = {
  doc: Document;
  editable: boolean;
  isTimeSeries: boolean;
  removeDocument?: CrudActions['removeDocument'];
  replaceDocument?: CrudActions['replaceDocument'];
  updateDocument?: CrudActions['updateDocument'];
  copyToClipboard?: CrudActions['copyToClipboard'];
  openInsertDocumentDialog?: CrudActions['openInsertDocumentDialog'];
  isExpanded: boolean;
};

type EditableJsonState = {
  editing: boolean;
  deleting: boolean;
  deleteFinished: boolean;
  containsErrors: boolean;
  value: string;
  initialValue: string;
};

/**
 * Component for a single editable document in a list of json documents.
 */
class EditableJson extends React.Component<
  EditableJsonProps,
  EditableJsonState
> {
  editor?: AceEditor;

  /**
   * The component constructor.
   *
   * @note: Local json object state is the current doc that's been serialised into an
   * EJSON.
   *
   * @param {Object} props - The properties.
   */
  constructor(props: EditableJsonProps) {
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
  }

  /**
   * Fold up all nested values when loading editors.
   */
  componentDidMount() {
    this.subscribeToDocumentEvents(this.props.doc);
    if (!this.props.isExpanded) {
      (this.editor?.getSession() as any).foldAll(2);
    }
  }

  componentDidUpdate(
    prevProps: EditableJsonProps,
    prevState: EditableJsonState
  ) {
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

    if (prevProps.isExpanded !== this.props.isExpanded) {
      this.props.isExpanded
        ? (this.editor?.getSession() as any).unfold()
        : (this.editor?.getSession() as any).foldAll(2);
    }

    if (
      prevState.editing !== this.state.editing &&
      this.state.editing === false
    ) {
      (this.editor?.getSession() as any).foldAll(2);
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
  subscribeToDocumentEvents(doc: Document) {
    doc.on('remove-success', this.handleRemoveSuccess);
    doc.on('update-success', this.handleUpdateSuccess);
  }

  /**
   * Unsubscribe from the hadron document events.
   *
   * @param {Document} doc - The hadron document.
   */
  unsubscribeFromDocumentEvents(doc: Document) {
    doc.removeListener('remove-success', this.handleRemoveSuccess);
    doc.removeListener('update-success', this.handleUpdateSuccess);
  }

  /**
   * Fires when the document update was successful.
   */
  handleUpdateSuccess = () => {
    if (this.state.editing) {
      setTimeout(() => {
        this.setState({ editing: false });
      }, 500);
    }
  };

  /**
   * Handle the successful remove.
   */
  handleRemoveSuccess = () => {
    if (this.state.deleting) {
      setTimeout(() => {
        this.setState({ deleting: false, deleteFinished: true });
      }, 500);
    }
  };

  /**
   * Handle the user clicking the cancel button.
   */
  handleCancel = () => {
    this.setState({
      containsErrors: false,
      editing: false,
      deleting: false,
      value: this._getObjectAsString(),
    });
  };

  /**
   * Handle copying JSON to clipboard of the json document.
   */
  handleCopy() {
    this.props.copyToClipboard?.(this.props.doc);
  }

  /**
   * Handle cloning of the json document.
   */
  handleClone() {
    const clonedDoc = this.props.doc.generateObject({
      excludeInternalFields: true,
    });
    this.props.openInsertDocumentDialog?.(clonedDoc, true);
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
  handleOnChange(value: string) {
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
            onEdit={
              !this.props.isTimeSeries ? this.handleEdit.bind(this) : undefined
            }
            onCopy={this.handleCopy.bind(this)}
            onRemove={
              !this.props.isTimeSeries
                ? this.handleDelete.bind(this)
                : undefined
            }
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
          copyable={false}
          formattable={false}
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
          this.props.replaceDocument?.(this.props.doc);
        }}
        onDelete={() => {
          this.props.removeDocument?.(this.props.doc);
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

  static displayName = 'EditableJson';

  static propTypes = {
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
}

export default EditableJson;
