import { EJSON } from 'bson';
import React from 'react';
import PropTypes from 'prop-types';
import jsonParse from 'fast-json-parse';
import { TextButton } from 'hadron-react-buttons';
import DocumentActions from './document-actions';
import RemoveDocumentFooter from './remove-document-footer';

import 'ace-builds';
import Ace from 'react-ace';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'mongodb-ace-mode';
import 'mongodb-ace-theme';

import 'ace-builds/src-noconflict/mode-json';

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
 * Different modes of editing: Progress, Success, Editing, Viewing, and Error.
 */
const PROGRESS = 'Progress';
const SUCCESS = 'Success';
const EDITING = 'Editing';
const VIEWING = 'Viewing';
const ERROR = 'Error';

/**
 * Map of modes to styles.
 */
const MODES = {
  'Progress': 'is-in-progress',
  'Success': 'is-success',
  'Error': 'is-error',
  'Editing': 'is-modified',
  'Viewing': 'is-viewing'
};

/**
 * Messages to be displayed when editing a document: empty, modified, updating,
 * updated and invalid document.
 */
const EMPTY = '';
const MODIFIED = 'Document Modified.';
const UPDATING = 'Updating Document.';
const UPDATED = 'Document Updated.';
const INVALID_MESSAGE = 'Update not permitted while document contains errors.';

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
    this.state = {
      editing: false,
      deleting: false,
      deleteFinished: false,
      mode: VIEWING,
      message: EMPTY,
      expandAll: false,
      json: null
    };

    this.boundForceUpdate = this.forceUpdate.bind(this);
    this.boundHandleCancel = this.handleCancel.bind(this);
    this.boundHandleUpdateError = this.handleUpdateError.bind(this);
    this.boundHandleUpdateSuccess = this.handleUpdateSuccess.bind(this);
    this.boundHandleRemoveSuccess = this.handleRemoveSuccess.bind(this);
  }

  /**
   * Fold up all nested values when loading editors.
   */
  componentDidMount() {
    this.editor.getSession().foldAll(2);
  }

  /**
   * Subscribe to the update store on mount.
   *
   * Fold all documents on update as well, since we might get fresh documents
   * from the query bar.
   */
  componentDidUpdate(prevProps) {
    if (!this.state.editing) {
      this.editor.getSession().foldAll(2);
    }
    if (this.state.editing && this.props.updateError) {
      this.handleUpdateError();
    } else if (this.state.deleting && this.props.updateSuccess) {
      this.handleRemoveSuccess();
    } else if (this.state.editing && this.props.updateSuccess) {
      this.handleUpdateSuccess();
    } else if (this.props.doc !== prevProps.doc) {
      // If the underlying document changed, that means that the collection
      // contents have been refreshed. Treat that like cancelling the edit.
      this.handleCancel();
    }
  }

  /**
   * Handle the user clicking the cancel button.
   */
  handleCancel() {
    this.setState({
      editing: false,
      deleting: false,
      mode: VIEWING,
      message: EMPTY,
      json: EJSON.stringify(this.props.doc.generateObject(), null, 2)
    });

    this.props.clearUpdateStatus();
  }

  /**
   * Handle user clicking update button.
   */
  handleUpdate() {
    this.setState({ mode: PROGRESS, message: UPDATING });
    this.props.replaceExtJsonDocument(EJSON.parse(this.state.json), this.props.doc);
  }

  /**
   * Fires when the json document update was successful.
   */
  handleUpdateSuccess() {
    setTimeout(() => {
      this.setState({mode: SUCCESS, message: UPDATED});
      setTimeout(() => {
        this.props.clearUpdateStatus();
        this.setState({editing: false, message: EMPTY, mode: VIEWING});
      }, 500);
    }, 250);
  }

  /**
   * Handle an error with the document update.
   *
   * @param {String} message - The error message.
   */
  handleUpdateError() {
    if (this.state.mode !== ERROR || this.state.message !== this.props.updateError) {
      this.setState({ mode: ERROR, message: this.props.updateError });
    }
  }

  /**
   * Handle the successful remove.
   */
  handleRemoveSuccess() {
    setTimeout(() => {
      this.props.clearUpdateStatus();
      this.setState({ deleting: false, deleteFinished: true });
    }, 500);
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
    this.props.openInsertDocumentDialog(this.props.doc.generateObject(), true);
  }

  /**
   * Handles json document deletion.
   */
  handleDelete() {
    this.setState({
      deleting: true,
      editing: false
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
   * Handle editor changes when updating the document
   *
   * @param {String} value - changed value of json doc being edited.
   */
  handleOnChange(value) {
    if (!!jsonParse(value).err) {
      this.setState({ json: value, mode: ERROR, message: INVALID_MESSAGE });
    } else {
      this.setState({ json: value, mode: EDITING, message: MODIFIED });
    }
  }

  /**
   * Check if document has errors: based on JSON.parse() and updateError set by
   * replaceExtJsonDocument.
   *
   * @returns {Bool} if errors are present in the current json doc.
   */
  hasErrors() {
    return !!jsonParse(this.state.json).err || this.props.updateError;
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
   * Get the style of the footer based on the current mode.
   *
   * @returns {String} The style.
   */
  footerStyle() {
    return `document-footer document-footer-${MODES[this.state.mode]}`;
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
          <DocumentActions
            edit={this.handleEdit.bind(this)}
            copy={this.handleCopy.bind(this)}
            remove={this.handleDelete.bind(this)}
            clone={this.handleClone.bind(this)}/>
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
    const OPTIONS = {
      tabSize: 2,
      fontSize: 11,
      minLines: 2,
      maxLines: Infinity,
      showGutter: true,
      // TODO: set this to false when editing
      readOnly: !this.state.editing,
      highlightActiveLine: false,
      highlightGutterLine: false,
      // TODO: set this to true when editing
      showLineNumbers: this.state.editing,
      vScrollBarAlwaysVisible: false,
      hScrollBarAlwaysVisible: false,
      fixedWidthGutter: false,
      showPrintMargin: false,
      displayIndentGuides: false,
      wrapBehavioursEnabled: true,
      foldStyle: 'markbegin',
      useWorker: false
    };

    const value = this.state.json !== null
      ? this.state.json
      : EJSON.stringify(this.props.doc.generateObject(), null, 2);

    return (
      <div className="json-ace-editor">
        <Ace
          mode="json"
          value={value}
          theme="mongodb"
          width="100%"
          editorProps={{$blockScrolling: Infinity}}
          onChange={this.handleOnChange.bind(this)}
          setOptions={OPTIONS}
          onLoad={(editor) => { this.editor = editor; }}/>
      </div>
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
        <div className={this.footerStyle()}>
          <div data-test-id="document-message"
            className="document-footer-message"
            title={this.state.message}>
            {this.state.message}
          </div>
          <div className="document-footer-actions">
            <TextButton
              className="btn btn-borderless btn-xs cancel"
              text="Cancel"
              dataTestId="cancel-document-button"
              clickHandler={this.boundHandleCancel} />
            <TextButton
              className="btn btn-default btn-xs"
              text="Replace"
              disabled={this.hasErrors()}
              dataTestId="update-document-button"
              clickHandler={this.handleUpdate.bind(this)} />
          </div>
        </div>
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
      <div className={this.jsonStyle()} data-test-id={TEST_ID}>
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
  updateSuccess: PropTypes.bool,
  replaceExtJsonDocument: PropTypes.func.isRequired,
  updateError: PropTypes.string,
  removeDocument: PropTypes.func.isRequired,
  clearUpdateStatus: PropTypes.func.isRequired,
  version: PropTypes.string.isRequired,
  editable: PropTypes.bool,
  tz: PropTypes.string,
  expandAll: PropTypes.bool,
  openInsertDocumentDialog: PropTypes.func.isRequired,
  openImportFileDialog: PropTypes.func.isRequired,
  copyToClipboard: PropTypes.func.isRequired
};

export default EditableJson;
