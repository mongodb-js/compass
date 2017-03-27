// TODO: Move this into a internal-packages/collection-ddl
const shell = require('electron').shell;
const React = require('react');
const Modal = require('react-bootstrap').Modal;
const { NamespaceStore } = require('hadron-reflux-store');
const { TextButton } = require('hadron-react-buttons');
const { ModalStatusMessage } = require('hadron-react-components');
const Actions = require('../actions/collections-actions');
const CreateCollectionStore = require('../stores/create-collection-store');
const CreateCollectionInput = require('./create-collection-input');
const CreateCollectionSizeInput = require('./create-collection-size-input');
const CreateCollectionCheckbox = require('./create-collection-checkbox');

/**
 * The help icon for capped collections url.
 */
const HELP_URL = 'https://docs.mongodb.com/manual/core/capped-collections/';

/**
 * The dialog to create a collection.
 */
class CreateCollectionDialog extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { open: false };
  }

  /**
   * Subscribe to the open dialog store.
   */
  componentWillMount() {
    this.unsubscribeOpen = Actions.openCreateCollectionDialog.listen(this.onOpenDialog.bind(this));
    this.unsubscribeCreate = CreateCollectionStore.listen(this.onCollectionCreated.bind(this));
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
   *
   * @param {String} databaseName - The database to create the collection on.
   */
  onOpenDialog(databaseName) {
    this.setState({
      open: true,
      collectionName: '',
      databaseName: databaseName,
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
  onHideModal() {
    this.setState({ open: false });
  }

  /**
   * Initiate the attempt to create a collection.
   * @param {Object} evt - The event object
   */
  onCreateCollectionButtonClicked(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    this.setState({ inProgress: true, error: false, errorMessage: '' });
    const databaseName = this.state.databaseName;
    Actions.createCollection(
      databaseName,
      this.state.collectionName,
      this.state.capped,
      this.state.maxSize
    );
    NamespaceStore.ns = databaseName;
  }

  /**
   * Handle finish collection creation.
   *
   * @param {Error} error - The error, if any.
   */
  onCollectionCreated(error) {
    if (error) {
      this.setState({ inProgress: false, error: true, errorMessage: error.message });
    } else {
      this.setState({ inProgress: false, error: false, errorMessage: '', open: false });
    }
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
      <Modal
        show={this.state.open}
        backdrop="static"
        onHide={this.onHideModal.bind(this)}
        dialogClassName="create-collection-dialog">

        <Modal.Header>
          <Modal.Title>Create Collection</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <form name="create-collection-dialog-form"
            onSubmit={this.onCreateCollectionButtonClicked.bind(this)}
            data-test-id="create-collection-modal"
          >
            <CreateCollectionInput
              autoFocus
              id="create-collection-name"
              name="Collection Name"
              value={this.state.collectionName}
              onChangeHandler={this.onCollectionNameChange.bind(this)} />
            <CreateCollectionCheckbox
              name="Capped Collection"
              className="create-collection-dialog-capped"
              checked={this.state.checked}
              onClickHandler={this.onCappedClicked.bind(this)}
              onHelpClickHandler={this.onHelpClicked.bind(this)} />
            {this.renderMaxSize()}
            {this.state.error ?
              <ModalStatusMessage icon="times" message={this.state.errorMessage} type="error" />
              : null}
            {this.state.inProgress ?
              <ModalStatusMessage icon="align-center" message={'Create in Progress'} type="in-progress" />
              : null}
          </form>
        </Modal.Body>

        <Modal.Footer>
          <TextButton
            className="btn btn-default btn-sm"
            text="Cancel"
            clickHandler={this.onHideModal.bind(this)} />
          <TextButton
            className="btn btn-primary btn-sm"
            dataTestId="create-collection-button"
            text="Create Collection"
            clickHandler={this.onCreateCollectionButtonClicked.bind(this)} />
        </Modal.Footer>
      </Modal>
    );
  }
}

CreateCollectionDialog.displayName = 'CreateCollectionDialog';

module.exports = CreateCollectionDialog;
