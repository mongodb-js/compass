const React = require('react');
const Element = require('hadron-document').Element;
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
 * The viewing mode.
 */
const VIEWING = 'Viewing';

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
    this.doc = props.doc;
    this.updateStore = props.updateStore;
    this.actions = props.actions;
    this.state = { mode: VIEWING, message: EMPTY };
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

    this.doc.on(Element.Events.Added, this.unsubscribeAdded);
    this.doc.on(Element.Events.Edited, this.unsubscribeEdited);
    this.doc.on(Element.Events.Removed, this.unsubscribeRemoved);
    this.doc.on(Element.Events.Reverted, this.unsubscribeReverted);
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
  }

  /**
   * Handle the user clicking the cancel button.
   */
  handleCancel() {
    this.doc.cancel();
    this.setState({ mode: VIEWING, message: EMPTY });
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
    const isModified = this.doc.isModified();
    this.setState({
      mode: isModified ? EDITING : VIEWING,
      message: isModified ? MODIFIED : EMPTY
    });
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
            clickHandler={this.handleCancel.bind(this)} />
          <TextButton
            className="btn btn-default btn-xs"
            text="Update"
            dataTestId="update-document-button"
            clickHandler={this.handleUpdate.bind(this)} />
        </div>
      </div>
    );
  }
}

DocumentFooter.displayName = 'DocumentFooter';

DocumentFooter.propTypes = {
  doc: React.PropTypes.object.isRequired,
  actions: React.PropTypes.object.isRequired,
  updateStore: React.PropTypes.object.isRequired
};

module.exports = DocumentFooter;
