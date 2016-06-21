'use strict';

const _ = require('lodash');
const React = require('react');
const Element = require('hadron-document').Element;
const DocumentUpdateStore = require('../store/document-update-store');
const Actions = require('../actions');

const PROGRESS = 'Progress';
const SUCCESS = 'Success';
const ERROR = 'Error';
const EDITING = 'Editing';
const VIEWING = 'Viewing';

const MODES = {
  'Progress': 'in-progress',
  'Success': 'success',
  'Error': 'error',
  'Editing': 'modified',
  'Viewing': 'viewing'
}

const EMPTY = '';
const MODIFIED = 'Document Modified.';
const UPDATING = 'Updating Document.';
const UPDATED = 'Document Updated.';

/**
 * Component for a the edit document footer.
 */
class EditFooter extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.doc = props.doc;
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
    this.unsubscribe = DocumentUpdateStore.listen(this.handleStoreTrigger.bind(this));
  }

  /**
   * Unsubscribe from the udpate store on unmount.
   */
  componentWillUnmount() {
    this.unsubscribe();
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
    console.log('##################### UPDATING ######################');
    console.log(object);
    this.setState({ mode: PROGRESS, message: UPDATING });
    Actions.updateDocument(object);
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
   * @param {ObjectId) id - The object id of the document.
   * @param {Boolean} success - If the update succeeded.
   * @param {Error, Document} object - The error or document.
   */
  handleStoreTrigger(id, success, object) {
    if (id === this.doc.doc._id) {
      if (success) {
        this.handleSuccess();
      } else {
        this.handleError(object);
      }
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
        {this.renderActions()}
      </div>
    );
  }

  /**
   * Render the actions for the footer.
   *
   * @returns {Component} The react component.
   */
  renderActions() {
    return (
      <div className='document-footer-actions'>
        {this.renderButtons()}
      </div>
    );
  }

  /**
   * Render the buttons for the footer.
   *
   * @returns {Component} The react component.
   */
  renderButtons() {
    if (this.state.mode === ERROR || this.state.mode === EDITING) {
      return [ this.renderCancelButton(), this.renderUpdateButton() ];
    }
  }

  /**
   * Render the cancel button.
   *
   * @returns {Component} The react component.
   */
  renderCancelButton() {
    return (
      <button
        key='cancelButton'
        className='btn btn-link btn-xs cancel'
        type='button'
        onClick={this.handleCancel.bind(this)}>
        Cancel
      </button>
    );
  }

  /**
   * Render the cancel button.
   *
   * @returns {Component} The react component.
   */
  renderUpdateButton() {
    return (
      <button
        key='updateButton'
        className='btn btn-default btn-xs update'
        type='button'
        onClick={this.handleUpdate.bind(this)}>
        Update
      </button>
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

EditFooter.displayName = 'EditFooter';

module.exports = EditFooter;
