// TODO: Move this into a internal-packages/collection-ddl
const React = require('react');
const Modal = require('react-bootstrap').Modal;
const app = require('hadron-app');
const { TextButton } = require('hadron-react-buttons');
const { ModalStatusMessage } = require('hadron-react-components');
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
    this.state = { collectionName: '', confirmName: '' };
    this.NamespaceStore = app.appRegistry.getStore('App.NamespaceStore');
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
   * @param {String} databaseName - The name of the database to drop the collection from.
   * @param {String} collectionName - The name of the collection to drop.
   */
  onOpenDialog(databaseName, collectionName) {
    this.setState({
      open: true,
      collectionName: collectionName,
      confirmName: '',
      databaseName: databaseName
    });
  }

  /**
   * When the cancel button is clicked.
   */
  onHideModal() {
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
    if (this.state.confirmName !== this.state.collectionName) {
      return;
    }

    this.setState({ inProgress: true, error: false, errorMessage: '' });
    Actions.dropCollection(this.state.databaseName, this.state.collectionName);
    this.NamespaceStore.ns = this.state.databaseName;
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
      <Modal show={this.state.open} backdrop="static" onHide={this.onHideModal.bind(this)}
          dialogClassName="drop-collection-dialog">
        <Modal.Header>
          <Modal.Title>Drop Collection</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div>
            <p className="drop-confirm-message">
              <i className="drop-confirm-icon fa fa-exclamation-triangle" aria-hidden="true"></i>
              To drop
              <span className="drop-confirm-namespace">{this.state.databaseName}.{this.state.collectionName}</span>
              type the collection name
              <span className="drop-confirm-collection">{this.state.collectionName}</span>
            </p>
          </div>
          <form data-test-id="drop-collection-modal"
              onSubmit={this.onDropCollectionButtonClicked.bind(this)}>
            <div className="form-group">
              <input
                autoFocus
                type="text"
                className="drop-confirm-input form-control"
                data-test-id="confirm-drop-collection-name"
                value={this.state.confirmName}
                onChange={this.onConfirmNameChanged.bind(this)} />
            </div>
            {this.state.error ?
              <ModalStatusMessage icon="times" message={this.state.errorMessage} type="error" />
              : null}
            {this.state.inProgress ?
              <ModalStatusMessage icon="spinner" message={'Drop in Progress'} type="in-progress" />
              : null}
          </form>
        </Modal.Body>

        <Modal.Footer>
          <TextButton
            className="btn btn-default btn-sm"
            text="Cancel"
            clickHandler={this.onHideModal.bind(this)} />
          <button
            className="btn btn-alert btn-sm"
            data-test-id="drop-collection-button"
            disabled={this.state.confirmName !== this.state.collectionName}
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
