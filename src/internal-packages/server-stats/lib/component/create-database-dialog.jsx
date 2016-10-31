const app = require('ampersand-app');
const shell = require('electron').shell;
const React = require('react');
const Modal = require('react-bootstrap').Modal;
const TextButton = require('hadron-app-registry').TextButton;
const Actions = require('../action/databases-actions');
const CreateDatabaseStore = require('../store/create-database-store');
const CreateCollectionInput = require('./create-collection-input');
const CreateCollectionSizeInput = require('./create-collection-size-input');
const CreateCollectionCheckbox = require('./create-collection-checkbox');

/**
 * The more information url.
 */
const INFO_URL = 'https://docs.mongodb.com/manual/faq/fundamentals/#how-do-i-create-a-database-and-a-collection';

/**
 * The help icon for capped collections url.
 */
const HELP_URL = 'https://docs.mongodb.com/manual/core/capped-collections/';

/**
 * The dialog to create a database.
 */
class CreateDatabaseDialog extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { open: false };
    this.ModalStatusMessage = app.appRegistry.getComponent('App.ModalStatusMessage');
  }

  /**
   * Subscribe to the open dialog store.
   */
  componentWillMount() {
    this.unsubscribeOpen = Actions.openCreateDatabaseDialog.listen(this.onOpenDialog.bind(this));
    this.unsubscribeCreate = CreateDatabaseStore.listen(this.onDatabaseCreated.bind(this));
  }

  /**
   * Unsubscribe from the store.
   */
  componentWillUnmount() {
    this.unsubscribeOpen();
    this.unsubscribeCreate();
  }

  /**
   * When the open dialog action is fired.
   */
  onOpenDialog() {
    this.setState({
      open: true,
      databaseName: '',
      collectionName: '',
      capped: false,
      maxSize: '',
      error: false,
      inProgress: false,
      errorMessage: ''
    });
  }

  /**
   * When the cancel button is clicked.
   */
  onCancelButtonClicked() {
    this.setState({ open: false });
  }

  /**
   * Initiate the attempt to create a database.
   */
  onCreateDatabaseButtonClicked() {
    this.setState({ inProgress: true, error: false, errorMessage: '' });
    Actions.createDatabase(
      this.state.databaseName,
      this.state.collectionName,
      this.state.capped,
      this.state.maxSize
    );
  }

  /**
   * Handle finish database creation.
   *
   * @param {Error} error - The error, if any.
   */
  onDatabaseCreated(error) {
    if (error) {
      this.setState({ inProgress: false, error: true, errorMessage: error.message });
    } else {
      this.setState({ inProgress: false, error: false, errorMessage: '', open: false });
    }
  }

  /**
   * Handle changing the database name.
   *
   * @param {Event} evt - The change event.
   */
  onDatabaseNameChange(evt) {
    this.setState({ databaseName: evt.target.value });
  }

  /**
   * Handle changing the collection name.
   *
   * @param {Event} evt - The change event.
   */
  onCollectionNameChange(evt) {
    this.setState({ collectionName: evt.target.value });
  }

  /**
   * Handle clicking the capped checkbox.
   */
  onCappedClicked() {
    this.setState({ capped: !this.state.capped });
  }

  /**
   * Handle clicking in the more information link.

   * @param {Event} evt - The event.
   */
  onInfoClicked(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    shell.openExternal(INFO_URL);
  }

  /**
   * Handle clicking the help icon.

   * @param {Event} evt - The event.
   */
  onHelpClicked(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    shell.openExternal(HELP_URL);
  }

  /**
   * Change the max collection size.
   *
   * @param {Event} evt - The event.
   */
  onMaxSizeChange(evt) {
    this.setState({ maxSize: evt.target.value });
  }

  /**
   * Render the max size component when capped is selected.
   *
   * @returns {React.Component} The component.
   */
  renderMaxSize() {
    if (this.state.capped) {
      return (
        <CreateCollectionSizeInput
          name="bytes max"
          placeholder="Enter max bytes"
          value={this.state.maxSize}
          onChangeHandler={this.onMaxSizeChange.bind(this)} />
      );
    }
  }

  /**
   * Render the modal dialog.
   *
   * @returns {React.Component} The react component.
   */
  render() {
    return (
      <Modal show={this.state.open} backdrop="static" keyboard={false} dialogClassName="create-database-dialog">
        <Modal.Header>
          <Modal.Title>Create Database</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <form name="create-database-dialog-form">
            <CreateCollectionInput
              name="Database Name"
              value={this.state.databaseName}
              onChangeHandler={this.onDatabaseNameChange.bind(this)} />
            <CreateCollectionInput
              name="Collection Name"
              value={this.state.collectionName}
              onChangeHandler={this.onCollectionNameChange.bind(this)} />
            <CreateCollectionCheckbox
              name="Capped Collection"
              className="create-database-dialog-capped"
              checked={this.state.checked}
              onClickHandler={this.onCappedClicked.bind(this)}
              onHelpClickHandler={this.onHelpClicked.bind(this)} />
            {this.renderMaxSize()}
            <div className="create-database-dialog-form-notice">
              Before MongoDB can save your new database, a collection name
              must also be specified at the time of creation.
              <a onClick={this.onInfoClicked.bind(this)}>More Information</a>
            </div>
            {this.state.error ?
              <this.ModalStatusMessage icon="times" message={this.state.errorMessage} type="error" />
              : null}
            {this.state.inProgress ?
              <this.ModalStatusMessage icon="align-center" message={'Create in Progress'} type="in-progress" />
              : null}
          </form>
        </Modal.Body>

        <Modal.Footer>
          <TextButton
            className="btn btn-default"
            text="Cancel"
            clickHandler={this.onCancelButtonClicked.bind(this)} />
          <TextButton
            className="btn btn-primary"
            text="Create Database"
            clickHandler={this.onCreateDatabaseButtonClicked.bind(this)} />
        </Modal.Footer>
      </Modal>
    );
  }
}

CreateDatabaseDialog.displayName = 'CreateDatabaseDialog';

module.exports = CreateDatabaseDialog;
