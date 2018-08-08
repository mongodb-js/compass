const app = require('hadron-app');
const shell = require('electron').shell;
const React = require('react');
const Modal = require('react-bootstrap').Modal;
const { TextButton } = require('hadron-react-buttons');
const { ModalStatusMessage } = require('hadron-react-components');
const Actions = require('../action');
const CreateDatabaseStore = require('../store/create-database-store');

/**
 * The more information url.
 */
const INFO_URL_CREATE_DB = 'https://docs.mongodb.com/manual/faq/fundamentals/#how-do-i-create-a-database-and-a-collection';

/**
 * The help icon for capped collections url.
 */
const HELP_URL_CAPPED = 'https://docs.mongodb.com/manual/core/capped-collections/';

/**
 * The help URL for collation.
 */
const HELP_URL_COLLATION = 'https://docs.mongodb.com/master/reference/collation/';

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
    this.state = {open: false};
    this.CreateCollectionInput = app.appRegistry.getComponent('Database.CreateCollectionInput');
    this.CreateCollectionSizeInput = app.appRegistry.getComponent('Database.CreateCollectionSizeInput');
    this.CreateCollectionCheckbox = app.appRegistry.getComponent('Database.CreateCollectionCheckbox');
    this.CreateCollectionCollationSelect = app.appRegistry.getComponent('Database.CreateCollectionCollationSelect');
    this.NamespaceStore = app.appRegistry.getStore('App.NamespaceStore');
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
      errorMessage: '',
      isCustomCollation: false,
      collation: {locale: 'simple'}
    });
  }

  /**
   * When the cancel button is clicked.
   */
  onHideModal() {
    this.setState({ open: false });
  }

  /**
   * Initiate the attempt to create a database.
   * @param {Object} evt - The event object
   */
  onCreateDatabaseButtonClicked(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.setState({ inProgress: true, error: false, errorMessage: '' });
    Actions.createDatabase(
      this.state.databaseName,
      this.state.collectionName,
      this.state.capped,
      this.state.maxSize,
      this.state.isCustomCollation,
      this.state.collation
    );
    this.NamespaceStore.ns = '';
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
   * Handle clicking the collation checkbox.
   */
  onCollationClicked() {
    this.setState({ isCustomCollation: !this.state.isCustomCollation });
  }

  /**
   * Handle clicking in the more information link.

   * @param {Event} evt - The event.
   */
  onInfoClicked(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    shell.openExternal(INFO_URL_CREATE_DB);
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
   * Set state to selected field of collation option.
   *
   * @param {String} field - The field.
   * @param {Event} evt - The event.
   */
  onCollationOptionChange(field, evt) {
    this.setState({
      collation: Object.assign({}, this.state.collation, {[field]: evt.value})
    });
  }

  /**
   * Render the max size component when capped is selected.
   *
   * @returns {React.Component} The component.
   */
  renderMaxSize() {
    if (this.state.capped) {
      return (
        <this.CreateCollectionSizeInput
          name="bytes max"
          placeholder="Enter max bytes"
          value={this.state.maxSize}
          onChangeHandler={this.onMaxSizeChange.bind(this)} />
      );
    }
  }

  /**
   * Render collation options when collation is selected.
   *
   * @returns {React.Component} The component.
   */
  renderCollation() {
    if (this.state.isCustomCollation) {
      return (
        <div className="create-collection-dialog-collation-div">
          <this.CreateCollectionCollationSelect
            collation={this.state.collation}
            onCollationOptionChange={this.onCollationOptionChange.bind(this)}
          />
        </div>
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
          <Modal.Title>Create Database</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <form name="create-collection-dialog-form"
              onSubmit={this.onCreateDatabaseButtonClicked.bind(this)}
              data-test-id="create-database-modal">
            <this.CreateCollectionInput
              autoFocus
              id="create-database-name"
              name="Database Name"
              value={this.state.databaseName}
              onChangeHandler={this.onDatabaseNameChange.bind(this)} />
            <this.CreateCollectionInput
              id="create-database-collection-name"
              name="Collection Name"
              value={this.state.collectionName}
              onChangeHandler={this.onCollectionNameChange.bind(this)} />
            <div className="form-group">
              <this.CreateCollectionCheckbox
                name="Capped Collection"
                titleClassName="create-collection-dialog-capped"
                helpUrl={HELP_URL_CAPPED}
                onClickHandler={this.onCappedClicked.bind(this)} />
              {this.renderMaxSize()}
              <this.CreateCollectionCheckbox
                name="Use Custom Collation"
                titleClassName="create-collection-dialog-collation"
                helpUrl={HELP_URL_COLLATION}
                onClickHandler={this.onCollationClicked.bind(this)}
              />
              {this.renderCollation()}
            </div>
            <div className="create-collection-dialog-form-notice">
              Before MongoDB can save your new database, a collection name
              must also be specified at the time of creation.
              <a onClick={this.onInfoClicked.bind(this)}>More Information</a>
            </div>
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
            dataTestId="create-database-button"
            text="Create Database"
            clickHandler={this.onCreateDatabaseButtonClicked.bind(this)} />
        </Modal.Footer>
      </Modal>
    );
  }
}

CreateDatabaseDialog.displayName = 'CreateDatabaseDialog';

module.exports = CreateDatabaseDialog;
