'use strict';

const _ = require('lodash');
const React = require('react');
const Element = require('hadron-document').Element;
const CancelEditButton = require('./cancel-edit-button');
const UpdateButton = require('./update-button');

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
 * Map of modes to styles.
 */
const MODES = {
  'Progress': 'in-progress',
  'Success': 'success',
  'Error': 'error',
  'Editing': 'modified',
  'Viewing': 'viewing'
}

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
    this.doc = props.doc;
    this.updateStore = props.updateStore;
    this.actions = props.actions;

    this.doc.on(Element.Events.Added, this.handleModification.bind(this));
    this.doc.on(Element.Events.Edited, this.handleModification.bind(this));
    this.doc.on(Element.Events.Removed, this.handleModification.bind(this));
    this.doc.on(Element.Events.Reverted, this.handleModification.bind(this));

    this.state = { mode: VIEWING, message: EMPTY };
  }

  /**
   * Subscribe to the update store on mount.
   */
  componentDidMount() {
    this.unsubscribeUpdate = this.updateStore.listen(this.handleStoreUpdate.bind(this));
  }

  /**
   * Unsubscribe from the udpate store on unmount.
   */
  componentWillUnmount() {
    this.unsubscribeUpdate();
  }

  /**
   * Handle the user clicking the cancel button.
   */
  handleCancel() {
    this.doc.cancel();
    this.setState({ mode: VIEWING });
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
   * Handle modification to the document.
   */
  handleModification() {
    this.setState({
      mode: this.doc.isModified() ? EDITING : VIEWING,
      message: MODIFIED
    });
  }

  /**
   * Handle the user clicking the update button.
   */
  handleUpdate() {
    var object = this.props.doc.generateObject();
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
   * @param {Error, Document} object - The error or document.
   */
  handleStoreUpdate(success, object) {
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
        <div className='edit-message'>
          {this.state.message}
        </div>
        <div className='document-footer-actions'>
          <CancelEditButton handler={this.handleCancel.bind(this)} />
          <UpdateButton handler={this.handleUpdate.bind(this)} />
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

DocumentFooter.displayName = 'DocumentFooter';

module.exports = DocumentFooter;
