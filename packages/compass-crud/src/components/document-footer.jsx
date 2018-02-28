import pull from 'lodash.pull';
import includes from 'lodash.includes';
import React from 'react';
import PropTypes from 'prop-types';
import { Element } from 'hadron-document';
import { TextButton } from 'hadron-react-buttons';

/**
 * The progress mode.
 */
const PROGRESS = 'Progress';

/**
 * The success mode.
 */
const SUCCESS = 'Success';

/**
 * The error mode.
 */
const ERROR = 'Error';

/**
 * The editing mode.
 */
const EDITING = 'Editing';

/**
 * The viewing mode.
 */
const VIEWING = 'Viewing';

/**
 * The invalid message.
 */
const INVALID_MESSAGE = 'Update not permitted while document contains errors.';

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
 * The empty message.
 */
const EMPTY = '';

/**
 * The modified message.
 */
const MODIFIED = 'Document Modified.';

/**
 * The updating message.
 */
const UPDATING = 'Updating Document.';

/**
 * The updated message.
 */
const UPDATED = 'Document Updated.';

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
    this.state = { mode: VIEWING, message: EMPTY };
    this.invalidElements = [];
    this.boundHandleUpdateError = this.handleUpdateError.bind(this);
    this.boundHandleUpdateSuccess = this.handleUpdateSuccess.bind(this);
    this.boundHandleCancel = this.handleCancel.bind(this);
    if (props.cancelHandler) {
      this.boundHandleCancel = props.cancelHandler;
    }
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
    this.props.doc.on('update-success', this.boundHandleUpdateSuccess);

    this.handleModification();
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
    this.props.doc.removeListener('update-success', this.boundHandleUpdateSuccess);
  }

  /**
   * Handle the user clicking the cancel button.
   */
  handleCancel() {
    if (this.props.api) {
      this.props.api.stopEditing();
    }
    this.props.doc.cancel();
    this.setState({ mode: VIEWING, message: EMPTY });
  }

  /**
   * Handle an error with the document update.
   *
   * @param {String} message - The error message.
   */
  handleUpdateError(message) {
    this.setState({ mode: ERROR, message: message });
  }

  /**
   * Handle a successful document update.
   */
  handleUpdateSuccess() {
    this.setState({ mode: SUCCESS, message: UPDATED });
  }

  /**
   * Handle an element becoming valid.
   *
   * @param {String} uuid - The element uuid.
   */
  handleValid(uuid) {
    pull(this.invalidElements, uuid);
  }

  /**
   * Handle an element becoming invalid.
   *
   * @param {String} uuid - The element uuid.
   */
  handleInvalid(uuid) {
    if (!includes(this.invalidElements, uuid)) {
      this.invalidElements.push(uuid);
      this.handleModification();
    }
  }

  /**
   * Handle modification to the document.
   */
  handleModification() {
    const isModified = this.props.doc.isModified();
    if (this.hasErrors()) {
      this.setState({ mode: ERROR, message: INVALID_MESSAGE });
    } else {
      this.setState({
        mode: isModified ? EDITING : VIEWING,
        message: isModified ? MODIFIED : EMPTY
      });
    }
  }

  /**
   * Handle the user clicking the update button.
   */
  handleUpdate() {
    if (this.props.api) {
      this.props.api.stopEditing();
    }
    this.setState({ mode: PROGRESS, message: UPDATING });
    this.props.updateDocument(this.props.doc);
  }

  /**
   * Does the document have invalid elements?
   *
   * @returns {Boolean} If the document has invalid elements.
   */
  hasErrors() {
    return this.invalidElements.length > 0;
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
    const { mode } = this.state;
    const showCancel = [EDITING, VIEWING, ERROR].includes(mode);
    const showUpdate = mode === EDITING;
    return (
      <div className={this.style()}>
        <div
          data-test-id="document-message"
          className="document-footer-message"
          title={this.state.message}>
          {this.state.message}
        </div>
        <div className="document-footer-actions">
          {showCancel && (
            <TextButton
              className="btn btn-borderless btn-xs cancel"
              text={mode === ERROR ? 'Ok' : 'Cancel'}
              dataTestId="cancel-document-button"
              clickHandler={this.boundHandleCancel} />
          )}
          {showUpdate && (
            <TextButton
              className="btn btn-default btn-xs"
              text="Update"
              disabled={this.hasErrors()}
              dataTestId="update-document-button"
              clickHandler={this.handleUpdate.bind(this)} />
          )}
        </div>
      </div>
    );
  }
}

DocumentFooter.displayName = 'DocumentFooter';

DocumentFooter.propTypes = {
  doc: PropTypes.object.isRequired,
  updateDocument: PropTypes.func.isRequired,
  cancelHandler: PropTypes.func,
  api: PropTypes.any
};

export default DocumentFooter;
