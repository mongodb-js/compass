const app = require('ampersand-app');
const React = require('react');
const Modal = require('react-bootstrap').Modal;
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const toNS = require('mongodb-ns');
const TextButton = require('hadron-app-registry').TextButton;
const Actions = require('../actions/collections-actions');
const DropCollectionStore = require('../stores/drop-collection-store');

/**
 * The dialog to drop a database.
 */
class DropCollectionDialog extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { name: '', confirmName: '' };
    this.ModalStatusMessage = app.appRegistry.getComponent('App.ModalStatusMessage');
  }

  /**
   * Subscribe to the open dialog store.
   */
  componentWillMount() {
    this.unsubscribeOpen = Actions.openDropCollectionDialog.listen(this.onOpenDialog.bind(this));
    this.unsubscribeDrop = DropCollectionStore.listen(this.onCollectionDropped.bind(this));
  }

  /**
   * Unsubscribe from the store.
   */
  componentWillUnmount() {
    this.unsubscribeOpen();
    this.unsubscribeDrop();
  }

  /**
   * When the open dialog action is fired.
   *
   * @param {String} name - The name of the database to drop.
   */
  onOpenDialog(name) {
    this.setState({
      open: true,
      name: name,
      confirmName: '',
      databaseName: toNS(NamespaceStore.ns).database
    });
  }

  /**
   * When the cancel button is clicked.
   */
  onCancelButtonClicked() {
    this.setState({ open: false });
  }

  /**
   * Initiate the attempt to drop a database.
   * @param {Object} evt - The event object
   */
  onDropCollectionButtonClicked(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    // prevent drop of collection if names don't match
    if (this.state.confirmName !== this.state.name) {
      return;
    }

    this.setState({ inProgress: true, error: false, errorMessage: '' });
    Actions.dropCollection(this.state.databaseName, this.state.name);
  }

  /**
   * Handle finish database dropping.
   *
   * @param {Error} error - The error, if any.
   */
  onCollectionDropped(error) {
    if (error) {
      this.setState({ inProgress: false, error: true, errorMessage: error.message });
    } else {
      this.setState({ inProgress: false, error: false, errorMessage: '', open: false });
    }
  }

  /**
   * Fires when the confirmation name is changed.
   *
   * @param {Event} evt - The change event.
   */
  onConfirmNameChanged(evt) {
    this.setState({ confirmName: evt.target.value });
  }

  /**
   * Render the modal dialog.
   *
   * @returns {React.Component} The react component.
   */
  render() {
    return (
      <Modal show={this.state.open} backdrop="static" keyboard={false} dialogClassName="drop-collection-dialog">
        <Modal.Header>
          <Modal.Title>Drop Collection</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div>
            <p className="drop-confirm-message">
              <i className="drop-confirm-icon fa fa-exclamation-triangle" aria-hidden="true"></i>
              Type the collection name
              <strong> {this.state.name} </strong>
              to drop
            </p>
          </div>
          <form data-test-id="drop-collection-modal"
              onSubmit={this.onDropCollectionButtonClicked.bind(this)}>
            <div className="form-group">
              <input
                type="text"
                className="drop-confirm-input form-control"
                value={this.state.confirmName}
                onChange={this.onConfirmNameChanged.bind(this)} />
            </div>
            {this.state.error ?
              <this.ModalStatusMessage icon="times" message={this.state.errorMessage} type="error" />
              : null}
            {this.state.inProgress ?
              <this.ModalStatusMessage icon="align-center" message={'Drop in Progress'} type="in-progress" />
              : null}
          </form>
        </Modal.Body>

        <Modal.Footer>
          <TextButton
            className="btn btn-default"
            text="Cancel"
            clickHandler={this.onCancelButtonClicked.bind(this)} />
          <button
            className="btn btn-primary"
            disabled={this.state.confirmName !== this.state.name}
            onClick={this.onDropCollectionButtonClicked.bind(this)}>
            Drop Collection
          </button>
        </Modal.Footer>
      </Modal>
    );
  }
}

DropCollectionDialog.displayName = 'DropCollectionDialog';

module.exports = DropCollectionDialog;
