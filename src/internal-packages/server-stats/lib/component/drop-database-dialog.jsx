const app = require('ampersand-app');
const React = require('react');
const Modal = require('react-bootstrap').Modal;
const { TextButton } = require('hadron-react-buttons');
const Actions = require('../action/databases-actions');
const DropDatabaseStore = require('../store/drop-database-store');

/**
 * The dialog to drop a database.
 */
class DropDatabaseDialog extends React.Component {

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
    this.unsubscribeOpen = Actions.openDropDatabaseDialog.listen(this.onOpenDialog.bind(this));
    this.unsubscribeDrop = DropDatabaseStore.listen(this.onDatabaseDropped.bind(this));
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
    this.setState({ open: true, name: name, confirmName: '' });
  }

  /**
   * When the cancel button is clicked.
   */
  onHideModal() {
    this.setState({ open: false });
  }

  /**
   * Initiate the attempt to drop a database.
   */
  onDropDatabaseButtonClicked() {
    this.setState({ inProgress: true, error: false, errorMessage: '' });
    Actions.dropDatabase(this.state.name);
  }

  /**
   * Handle finish database dropping.
   *
   * @param {Error} error - The error, if any.
   */
  onDatabaseDropped(error) {
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
          dialogClassName="drop-database-dialog">
        <Modal.Header>
          <Modal.Title>Drop Database</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div>
            <p className="drop-confirm-message">
              <i className="drop-confirm-icon fa fa-exclamation-triangle" aria-hidden="true"></i>
              Type the database name
              <strong> {this.state.name} </strong>
              to drop
            </p>
          </div>
          <form data-test-id="drop-database-modal">
            <div className="form-group">
              <input
                type="text"
                className="drop-confirm-input form-control"
                data-test-id="confirm-drop-database-name"
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
            clickHandler={this.onHideModal.bind(this)} />
          <button
            className="btn btn-primary"
            data-test-id="drop-database-button"
            disabled={this.state.confirmName !== this.state.name}
            onClick={this.onDropDatabaseButtonClicked.bind(this)}>
            Drop Database
          </button>
        </Modal.Footer>
      </Modal>
    );
  }
}

DropDatabaseDialog.displayName = 'DropDatabaseDialog';

module.exports = DropDatabaseDialog;
