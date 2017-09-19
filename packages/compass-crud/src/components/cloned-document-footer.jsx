const _ = require('lodash');
const React = require('react');
const PropTypes = require('prop-types');
const { Element } = require('hadron-document');
const { TextButton } = require('hadron-react-buttons');

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
 * The initial mode.
 */
const CLONING = 'Cloning';

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
  'Cloning': 'is-modified'
};

/**
 * The default message.
 */
const CLONED = 'Document Cloned';

/**
 * The modified message.
 */
const MODIFIED = 'Document Modified.';

/**
 * The updating message.
 */
const UPDATING = 'Inserting Document.';

/**
 * The updated message.
 */
const UPDATED = 'Document Inserted.';

/**
 * Component for a the edit document footer.
 */
class ClonedDocumentFooter extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.doc = props.doc;
    this.updateStore = props.updateStore;
    this.actions = props.actions;
    this.state = { mode: CLONING, message: CLONED };
    this.invalidElements = [];

    this.handleCancel = props.cancelHandler;
  }

  /**
   * Subscribe to the update store on mount.
   */
  componentDidMount() {
    this.unsubscribeUpdate = this.updateStore.listen(this.handleStoreUpdate.bind(this));

    this.unsubscribeAdded = this.handleModification.bind(this);
    this.unsubscribeEdited = this.handleModification.bind(this);
    this.unsubscribeRemoved = this.handleModification.bind(this);
    this.unsubscribeReverted = this.handleModification.bind(this);
    this.unsubscribeInvalid = this.handleInvalid.bind(this);
    this.unsubscribeValid = this.handleValid.bind(this);

    this.doc.on(Element.Events.Added, this.unsubscribeAdded);
    this.doc.on(Element.Events.Edited, this.unsubscribeEdited);
    this.doc.on(Element.Events.Removed, this.unsubscribeRemoved);
    this.doc.on(Element.Events.Reverted, this.unsubscribeReverted);
    this.doc.on(Element.Events.Invalid, this.unsubscribeInvalid);
    this.doc.on(Element.Events.Valid, this.unsubscribeValid);

    this.handleModification();
  }

  /**
   * Unsubscribe from the udpate store on unmount.
   */
  componentWillUnmount() {
    this.unsubscribeUpdate();
    this.doc.removeListener(Element.Events.Added, this.unsubscribeAdded);
    this.doc.removeListener(Element.Events.Edited, this.unsubscribeEdited);
    this.doc.removeListener(Element.Events.Removed, this.unsubscribeRemoved);
    this.doc.removeListener(Element.Events.Reverted, this.unsubscribeReverted);
    this.doc.removeListener(Element.Events.Invalid, this.unsubscribeInvalid);
    this.doc.removeListener(Element.Events.Valid, this.unsubscribeValid);
  }

  /**
   * Handle an error with the document update.
   *
   * @param {Error} error - The error.
   */
  handleError(error) {
    this.setState({ mode: ERROR, message: error.message });
  }

  handleValid(uuid) {
    _.pull(this.invalidElements, uuid);
  }

  handleInvalid(uuid) {
    if (!_.includes(this.invalidElements, uuid)) {
      this.invalidElements.push(uuid);
      this.handleModification();
    }
  }

  /**
   * Handle modification to the document.
   */
  handleModification() {
    const isModified = this.doc.isModified();
    if (this.hasErrors()) {
      this.setState({ mode: ERROR, message: INVALID_MESSAGE });
    } else {
      this.setState({
        mode: isModified ? EDITING : CLONING,
        message: isModified ? MODIFIED : CLONED
      });
    }
  }

  /**
   * Handle the user clicking the update button.
   */
  handleUpdate() {
    const object = this.props.doc.generateObject();
    this.setState({ mode: PROGRESS, message: UPDATING });
    this.actions.update(object);
  }

  /**
   * Handle a successful document update.
   */
  handleSuccess() {
    this.setState({ mode: SUCCESS, message: UPDATED });
  }

  /**
   * Handles a trigger from the store.
   *
   * @param {Boolean} success - If the update succeeded.
   * @param {Object} object - The error or document.
   */
  handleStoreUpdate(success, object) {
    if (success) {
      this.handleSuccess();
    } else {
      this.handleError(object);
    }
  }

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
            clickHandler={this.handleCancel} />
          <TextButton
            className="btn btn-default btn-xs"
            text="Update"
            disabled={this.hasErrors()}
            dataTestId="update-document-button"
            clickHandler={this.handleUpdate.bind(this)} />
        </div>
      </div>
    );
  }
}

ClonedDocumentFooter.displayName = 'ClonedDocumentFooter';

ClonedDocumentFooter.propTypes = {
  doc: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  updateStore: PropTypes.object.isRequired,
  cancelHandler: PropTypes.func.isRequired
};

module.exports = ClonedDocumentFooter;
