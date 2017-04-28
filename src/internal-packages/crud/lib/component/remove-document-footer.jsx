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
    this.doc = props.doc;
    this.actions = props.actions;
    this.removeStore = props.removeStore;
    this.state = { mode: DELETING, message: MODIFIED };
  }

  /**
   * Subscribe to the remove store on mount.
   */
  componentDidMount() {
    this.unsubscribeRemove = this.removeStore.listen(this.handleStoreRemove.bind(this));
  }

  /**
   * Unsubscribe from the remove store on unmount.
   */
  componentWillUnmount() {
    this.unsubscribeRemove();
  }

  /**
   * Handle an error with the document update.
   *
   * @param {Error} error - The error.
   */
  handleError(error) {
    this.setState({ mode: ERROR, message: error.message });
  }

  /**
   * Handle the user clicking the update button.
   */
  handleRemove() {
    this.setState({ mode: PROGRESS, message: UPDATING });
    this.actions.remove(this.doc);
  }

  /**
   * Handle a successful document update.
   */
  handleSuccess() {
    this.setState({ mode: DELETING, message: UPDATED });
  }

  /**
   * Handles a trigger from the store.
   *
   * @param {Boolean} success - If the delete succeeded.
   * @param {Object} object - The error or document.
   */
  handleStoreRemove(success, object) {
    if (success) {
      this.handleSuccess();
    } else {
      this.handleError(object);
    }
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
  actions: PropTypes.object.isRequired,
  removeStore: PropTypes.object.isRequired,
  cancelHandler: PropTypes.func.isRequired
};

module.exports = RemoveDocumentFooter;
