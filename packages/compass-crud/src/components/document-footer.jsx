import { pull } from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Element } from 'hadron-document';
import { TextButton } from 'hadron-react-buttons';

// Document editing modes.
const PROGRESS_MODE = 'Progress';
const SUCCESS_MODE = 'Success';
const BLOCKED_MODE = 'Blocked';
const ERROR_MODE = 'Error';
const EDITING_MODE = 'Editing';
const VIEWING_MODE = 'Viewing';

/**
 * Map of modes to styles.
 */
const MODES = {
  'Progress': 'is-in-progress',
  'Success': 'is-success',
  'Error': 'is-error',
  'Blocked': 'is-error',
  'Editing': 'is-modified',
  'Viewing': 'is-viewing'
};

// Document editing messages.
const EMPTY_MESSAGE = '';
const MODIFIED_MESSAGE = 'Document Modified.';
const UPDATING_MESSAGE = 'Updating Document.';
const UPDATED_MESSAGE = 'Document Updated.';
const INVALID_MESSAGE = 'Update not permitted while document contains errors.';
const WAITING_OVERWRITE_CONFIRMATION_MESSAGE = 'Document was modified in the background or it longer exists. Do you wish to continue and possibly overwrite new changes?';

/**
 * Component for a the edit document footer.
 */
class DocumentFooter extends React.Component {
  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { mode: VIEWING_MODE, message: EMPTY_MESSAGE };
    this.invalidElements = [];
    this.boundHandleUpdateBlocked = this.handleUpdateBlocked.bind(this);
    this.boundHandleUpdateError = this.handleUpdateError.bind(this);
    this.boundHandleUpdateSuccess = this.handleUpdateSuccess.bind(this);
    this.boundHandleCancel = this.handleCancel.bind(this);
  }

  /**
   * Subscribe to the update store on mount.
   */
  componentDidMount() {
    this.unsubscribeModified = this.handleModification.bind(this);
    this.unsubscribeInvalid = this.handleInvalid.bind(this);
    this.unsubscribeValid = this.handleValid.bind(this);

    this.props.doc.on(Element.Events.Added, this.unsubscribeModified);
    this.props.doc.on(Element.Events.Edited, this.unsubscribeModified);
    this.props.doc.on(Element.Events.Removed, this.unsubscribeModified);
    this.props.doc.on(Element.Events.Reverted, this.unsubscribeModified);
    this.props.doc.on(Element.Events.Invalid, this.unsubscribeInvalid);
    this.props.doc.on(Element.Events.Valid, this.unsubscribeValid);
    this.props.doc.on('update-error', this.boundHandleUpdateError);
    this.props.doc.on('update-blocked', this.boundHandleUpdateBlocked);
    this.props.doc.on('update-success', this.boundHandleUpdateSuccess);

    this.handleModification();
  }

  /**
   * Handle a possible switch of the document that we're targeting.
   */
  componentDidUpdate(prevProps) {
    if (this.props.doc !== prevProps.doc) {
      // If the underlying document changed, that means that the collection
      // contents have been refreshed. Treat that like cancelling the edit.
      this.handleCancel();
    }
    if (
      this.props.editing !== prevProps.editing ||
      this.props.containsErrors !== prevProps.containsErrors ||
      this.props.modified !== prevProps.modified
    ) {
      this.handleModification();
    }
  }

  /**
   * Unsubscribe from the udpate store on unmount.
   */
  componentWillUnmount() {
    this.props.doc.removeListener(Element.Events.Added, this.unsubscribeModified);
    this.props.doc.removeListener(Element.Events.Edited, this.unsubscribeModified);
    this.props.doc.removeListener(Element.Events.Removed, this.unsubscribeModified);
    this.props.doc.removeListener(Element.Events.Reverted, this.unsubscribeModified);
    this.props.doc.removeListener(Element.Events.Invalid, this.unsubscribeInvalid);
    this.props.doc.removeListener(Element.Events.Valid, this.unsubscribeValid);
    this.props.doc.removeListener('update-error', this.boundHandleUpdateError);
    this.props.doc.removeListener('update-blocked', this.boundHandleUpdateBlocked);
    this.props.doc.removeListener('update-success', this.boundHandleUpdateSuccess);
  }

  /**
   * Handle the user clicking the cancel button.
   */
  handleCancel() {
    if (this.props.cancelHandler) {
      this.props.cancelHandler();
      return;
    }
    if (this.props.api) {
      this.props.api.stopEditing();
    }
    this.props.doc.cancel();
    this.setState({ mode: VIEWING_MODE, message: EMPTY_MESSAGE });
  }

  /**
   * Handle an error with the document update.
   *
   * @param {String} message - The error message.
   */
  handleUpdateError(message) {
    this.setState({ mode: ERROR_MODE, message: message });
  }

  /**
   * Handle a successful document update.
   */
  handleUpdateSuccess() {
    this.setState({ mode: SUCCESS_MODE, message: UPDATED_MESSAGE });
  }

  /**
   * Handle when a document is blocked from updating (underlying data has changed).
   */
  handleUpdateBlocked() {
    this.setState({ mode: BLOCKED_MODE, message: WAITING_OVERWRITE_CONFIRMATION_MESSAGE });
  }

  /**
   * Handle an element becoming valid.
   *
   * @param {Element} el - Element
   */
  handleValid(el) {
    pull(this.invalidElements, el.uuid);
  }

  /**
   * Handle an element becoming invalid.
   *
   * @param {Element} el - Element
   */
  handleInvalid(el) {
    if (!this.invalidElements.includes(el.uuid)) {
      this.invalidElements.push(el.uuid);
      this.handleModification();
    }
  }

  /**
   * Handle modification to the document.
   */
  handleModification() {
    if (this.hasErrors()) {
      this.setState({ mode: ERROR_MODE, message: INVALID_MESSAGE });
    } else {
      const isModified = this.isModified();
      this.setState({
        mode: isModified ? EDITING_MODE : VIEWING_MODE,
        message: isModified ? MODIFIED_MESSAGE : EMPTY_MESSAGE
      });
    }
  }

  /**
   * Handle the user clicking the update button.
   */
  handleUpdate() {
    // When the mode shown is blocked and a user requests to update
    // it means they intend to overwrite/force update values of the document
    // that may have changed in the background.
    const forceUpdate = !this.props.updateDocument || this.state.mode === BLOCKED_MODE;

    if (this.props.api) {
      this.props.api.stopEditing();
    }
    this.setState({ mode: PROGRESS_MODE, message: UPDATING_MESSAGE });

    if (forceUpdate) {
      this.props.replaceDocument(this.props.doc);
    } else {
      this.props.updateDocument(this.props.doc);
    }
  }

  /**
   * Does the document have invalid elements?
   *
   * @returns {Boolean} If the document has invalid elements.
   */
  hasErrors() {
    return this.props.containsErrors ?? this.invalidElements.length > 0;
  }

  isModified() {
    return this.props.modified ?? this.props.doc.isModified();
  }

  /**
   * Get the style of the footer based on the current mode.
   *
   * @returns {String} The style.
   */
  style() {
    return `document-footer document-footer-${MODES[this.state.mode]}`;
  }

  /**
   * Render the footer.
   *
   * @returns {Component} The footer component.
   */
  render() {
    return (
      <div className={this.style()}>
        <div
          data-test-id="document-message"
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
            text={this.props.updateDocument ? 'Update' : 'Replace'}
            disabled={this.hasErrors()}
            dataTestId="update-document-button"
            clickHandler={this.handleUpdate.bind(this)}
          />
        </div>
      </div>
    );
  }
}

DocumentFooter.displayName = 'DocumentFooter';

DocumentFooter.propTypes = {
  doc: PropTypes.object.isRequired,
  replaceDocument: PropTypes.func.isRequired,
  updateDocument: PropTypes.func,
  cancelHandler: PropTypes.func,
  api: PropTypes.any,
  editing: PropTypes.bool,
  modified: PropTypes.bool,
  containsErrors: PropTypes.bool
};

export default DocumentFooter;
