'use strict';

const React = require('react');
const TextButton = require('hadron-app-registry').TextButton;

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
const DELETING = 'Deleting';

/**
 * Map of modes to styles.
 */
const MODES = {
  'Progress': 'in-progress',
  'Success': 'success',
  'Error': 'error',
  'Deleting': 'error'
}

/**
 * The empty message.
 */
const EMPTY = '';

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
    this.setState({ mode: SUCCESS, message: UPDATED });
  }

  /**
   * Handles a trigger from the store.
   *
   * @param {Boolean} success - If the delete succeeded.
   * @param {Error, Document} object - The error or document.
   */
  handleStoreRemove(success, object) {
    if (success) {
      this.handleSuccess();
    } else {
      this.handleError(object);
    }
  }

  /**
   * Render the footer.
   *
   * @returns {Component} The footer component.
   */
  render() {
    return (
      <div className={this.style()}>
        <div className='edit-message' title={this.state.message}>
          {this.state.message}
        </div>
        <div className='document-footer-actions'>
          <TextButton
            className='btn btn-link btn-xs cancel'
            text='Cancel'
            clickHandler={this.props.cancelHandler} />
          <TextButton
            className='btn btn-default btn-xs error'
            text='Delete'
            clickHandler={this.handleRemove.bind(this)} />
        </div>
      </div>
    );
  }

  /**
   * Get the style of the footer based on the current mode.
   *
   * @returns {String} The style.
   */
  style() {
    return `document-footer ${MODES[this.state.mode]}`;
  }
}

RemoveDocumentFooter.displayName = 'RemoveDocumentFooter';

module.exports = RemoveDocumentFooter;
