const React = require('react');
const PropTypes = require('prop-types');
const { TextButton } = require('hadron-react-buttons');

/**
 * The progress mode.
 */
const PROGRESS = 'Progress';

/**
 * The error mode.
 */
const ERROR = 'Error';

/**
 * The editing mode.
 */
const DELETING = 'Deleting';

/**
 * The success mode.
 */
const SUCCESS = 'Success';

/**
 * Map of modes to styles.
 */
const MODES = {
  'Progress': 'is-in-progress',
  'Success': 'is-success',
  'Error': 'is-error',
  'Deleting': 'is-error'
};

/**
 * The modified message.
 */
const MODIFIED = 'Document Flagged For Deletion.';

/**
 * The updating message.
 */
const UPDATING = 'Deleting Document.';

/**
 * The updated message.
 */
const UPDATED = 'Document Deleted.';

/**
 * Component for a the remove document footer.
 */
class RemoveDocumentFooter extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { mode: DELETING, message: MODIFIED };
    this.boundHandleRemoveError = this.handleRemoveError.bind(this);
    this.boundHandleRemoveSuccess = this.handleRemoveSuccess.bind(this);
  }

  /**
   * Subscribe to the document events.
   */
  componentDidMount() {
    this.props.doc.on('remove-error', this.boundHandleRemoveError);
    this.props.doc.on('remove-success', this.boundHandleRemoveSuccess);
  }

  /**
   * Unsubscribe from the document events.
   */
  componentWillUnmount() {
    this.props.doc.removeListener('remove-error', this.boundHandleRemoveError);
    this.props.doc.removeListener('remove-success', this.boundHandleRemoveSuccess);
  }

  /**
   * Handle an error with the document update.
   *
   * @param {String} message - The error message.
   */
  handleRemoveError(message) {
    this.setState({ mode: ERROR, message: message });
  }

  /**
   * Handle the user clicking the update button.
   */
  handleRemove() {
    if (this.props.api) {
      this.props.api.stopEditing();
    }
    this.setState({ mode: PROGRESS, message: UPDATING });
    this.props.removeDocument(this.props.doc);
  }

  /**
   * Handle a successful document update.
   */
  handleRemoveSuccess() {
    this.setState({ mode: SUCCESS, message: UPDATED });
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
          className="document-footer-message"
          data-test-id="document-message"
          title={this.state.message}>
          {this.state.message}
        </div>
        <div className="document-footer-actions">
          <TextButton
            className="btn btn-borderless btn-xs cancel"
            text="Cancel"
            dataTestId="cancel-document-button"
            clickHandler={this.props.cancelHandler} />
          <TextButton
            className="btn btn-default btn-xs error"
            text="Delete"
            dataTestId="confirm-delete-document-button"
            clickHandler={this.handleRemove.bind(this)} />
        </div>
      </div>
    );
  }
}

RemoveDocumentFooter.displayName = 'RemoveDocumentFooter';

RemoveDocumentFooter.propTypes = {
  doc: PropTypes.object.isRequired,
  removeDocument: PropTypes.func.isRequired,
  cancelHandler: PropTypes.func.isRequired,
  api: PropTypes.any
};

module.exports = RemoveDocumentFooter;
