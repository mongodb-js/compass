const app = require('ampersand-app');
const React = require('react');
const Modal = require('react-bootstrap').Modal;
const CreateIndexStore = require('../store/create-index-store');
const DDLStatusStore = require('../store/ddl-status-store');
const SelectedIndexField = require('./selected-index-field');
const CreateIndexCheckbox = require('./create-index-checkbox');
const CreateIndexField = require('./create-index-field');
const CreateIndexTextField = require('./create-index-text-field');
const OptionsToggleBar = require('./options-toggle-bar');
const Action = require('../action/index-actions');

/**
 * The index options and parameters to display.
 */
const INDEX_OPTIONS = [
  {name: 'background', desc: 'Build index in the background', param: false, paramUnit: ''},
  {name: 'unique', desc: 'Create unique index', param: false, paramUnit: ''},
  {name: 'ttl', desc: 'Create TTL', param: true, paramUnit: 'seconds'},
  {name: 'partialFilterExpression', desc: 'Partial Filter Expression', param: true, paramUnit: ''}
];

/**
 * Component for the create index modal.
 */
class CreateIndexModal extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = {
      showOptions: false,
      error: false,
      errorMessage: '',
      inProgress: false,
      schemaFields: [],
      fields: [],
      options: {}
    };
    this.ModalStatusMessage = app.appRegistry.getComponent('App.ModalStatusMessage');
  }

  /**
   * Subscribe on mount.
   */
  componentWillMount() {
    this.unsubscribeCreateField = CreateIndexStore.listen(this.handleStoreChange.bind(this));
    this.unsubscribeDDLStatus = DDLStatusStore.listen(this.handleStatusChange.bind(this));
  }

  /**
   * Unsubscribe on unmount.
   */
  componentWillUnmount() {
    this.unsubscribeCreateField();
    this.unsubscribeDDLStatus();
  }

  /**
   * Create option field and parameter forms for each option in INDEX_OPTIONS.
   *
   * @returns {Array} The React components for option fields and their parameters (if necessary).
   */
  getOptionFields() {
    let idx = 0;
    const options = [];
    for (const option of INDEX_OPTIONS) {
      options.push(
        <CreateIndexCheckbox
          key={idx++}
          description={option.desc}
          isParam={false}
          option={option.name} />
      );
      if (option.param) {
        const propOption = this.state.options[option.name];
        options.push(
          <CreateIndexTextField
            key={idx++}
            enabled={propOption ? propOption.value : false}
            isParam
            option={option.name}
            units={option.paramUnit} />
        );
      }
    }
    return options;
  }

  /**
   * Create React components for each selected field in the create index form.
   *
   * @returns {Array} The React components for each field, or null if none are selected.
   */
  getSelectedFields() {
    if (!this.state.fields.length) {
      return null;
    }
    return this.state.fields.map((field, idx) => <SelectedIndexField key={idx} field={field} />);
  }

  /**
   * Close modal and fire clear create index form action.
   */
  close() {
    Action.clearForm();
    this.setState({inProgress: false, error: false, errorMessage: ''});
    this.props.close();
  }

  /**
   * Close modal when cancel is clicked.
   */
  handleCancel() {
    this.close();
  }

  /**
   * Fire trigger index creation action when create button is clicked and close modal.
   *
   * @param {Object} evt - The click event.
   */
  handleCreate(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    Action.triggerIndexCreation();
  }

  /**
   * Handle changes in creation state (success, error, or complete).
   *
   * @param {string} status - The status.
   * @param {string} message - The error message.
   */
  handleStatusChange(status, message) {
    if (status === 'inProgress') {
      this.setState({inProgress: true, error: false, errorMessage: message});
    } else if (status === 'error') {
      this.setState({inProgress: false, error: true, errorMessage: message});
    } else {
      this.close();
    }
  }

  /**
   * Store updates to create index form and possible schema fields in state.
   *
   * @param {Array} fields - The index fields.
   * @param {Object} options - The index options.
   * @param {Array} schemaFields - The possible index fields for the schema.
   */
  handleStoreChange(fields, options, schemaFields) {
    this.setState({fields: fields, options: options, schemaFields: schemaFields});
  }

  /**
   * Toggle showOptions state value when toggle bar is clicked.
   *
   * @param {Object} evt - The click event.
   */
  handleToggleBarClick(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.setState({showOptions: !this.state.showOptions});
  }

  /**
   * Render the create and cancel buttons.
   *
   * @returns {React.Component} The create and cancel buttons.
   */
  renderButtons() {
    return (
      <div className="create-index-confirm-buttons">
        <button
          className="btn btn-default btn-sm create-index-confirm-buttons-cancel"
          type="button"
          onClick={this.handleCancel.bind(this)}>
          Cancel
        </button>
        <button
          className="btn btn-primary btn-sm create-index-confirm-buttons-create"
          disabled={!this.state.fields.length}
          type="submit">
          Create
        </button>
      </div>
    );
  }

  /**
   * Render the create index modal.
   *
   * @returns {React.Component} The create index modal.
   */
  render() {
    return (
      <Modal show={this.props.open}
        backdrop="static"
        dialogClassName="create-index-modal"
        keyboard={false}
        onHide={this.close.bind(this)} >

        <div className="create-index-modal-content">
          <Modal.Header>
            <Modal.Title>Index Create</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <form onSubmit={this.handleCreate.bind(this)}>
              <p className="create-index-description">Choose an index name</p>
              <CreateIndexTextField
                isParam={false}
                option={'name'} />

              <div className="create-index-fields">
                <p className="create-index-description">Add fields and types</p>
                <CreateIndexField
                  fields={this.state.schemaFields} />
                {this.getSelectedFields()}
              </div>

              <OptionsToggleBar
                showOptions={this.state.showOptions}
                onClick={this.handleToggleBarClick.bind(this)} />

              {this.state.showOptions ?
                <div className="create-index-options">
                  {this.getOptionFields()}
                </div>
                : null}

              {this.state.error ?
                <this.ModalStatusMessage icon="times" message={this.state.errorMessage} type="error" />
                : null}

              {this.state.inProgress ?
                <this.ModalStatusMessage icon="align-center" message={'Create in Progress'} type="in-progress" />
                : this.renderButtons()}
            </form>
          </Modal.Body>
        </div>
      </Modal>
    );
  }
}

CreateIndexModal.displayName = 'CreateIndexModal';

CreateIndexModal.propTypes = {
  open: React.PropTypes.bool.isRequired,
  close: React.PropTypes.func.isRequired
};

module.exports = CreateIndexModal;
