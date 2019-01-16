import app from 'hadron-app';
import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import { ModalStatusMessage } from 'hadron-react-components';
import { CreateIndexStore, DDLStatusStore } from 'stores';
import CreateIndexCheckbox from 'components/create-index-checkbox';
import CreateIndexField from 'components/create-index-field';
import CreateIndexTextField from 'components/create-index-text-field';
import OptionsToggleBar from 'components/options-toggle-bar';
import Actions from 'actions';
import pluck from 'lodash.pluck';

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
 * The help URL for collation.
 */
const HELP_URL_COLLATION = 'https://docs.mongodb.com/master/reference/collation/';

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
      showOptions: true,
      error: false,
      errorMessage: '',
      inProgress: false,
      schemaFields: [],
      fields: [],
      options: {},
      isCustomCollation: false
    };
    this.CreateCollectionCollationSelect = app.appRegistry.getComponent('Database.CreateCollectionCollationSelect');
    this.CreateCollectionCheckbox = app.appRegistry.getComponent('Database.CreateCollectionCheckbox');
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
   * Set state to selected field of collation option.
   *
   * @param {String} field - The field.
   * @param {Event} evt - The event.
   */
  onCollationOptionChange(field, evt) {
    Actions.updateOption('collation', {[field]: evt.value});
  }

  /**
   * Handle clicking the collation checkbox.
   */
  onCollationClicked() {
    this.setState({ isCustomCollation: !this.state.isCustomCollation });
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
      const propOption = this.state.options[option.name];
      const checked = propOption === undefined ? false : propOption.value;
      options.push(
        <CreateIndexCheckbox
          key={idx++}
          description={option.desc}
          isParam={false}
          dataTestId={`create-index-modal-${option.name}-checkbox`}
          option={option.name}
          checked={checked}/>
      );
      if (option.param) {
        let val;
        if (propOption === undefined || propOption.param === undefined) {
          val = option.name === 'partialFilterExpression'
            ? '{}'
            : '';
        } else {
          val = propOption.param;
        }
        options.push(
          <CreateIndexTextField
            key={idx++}
            enabled={propOption ? propOption.value : false}
            isParam
            option={option.name}
            dataTestId={`create-index-modal-${option.name}-field`}
            units={option.paramUnit}
            value={val}/>
        );
      }
    }
    options.push(<div className="create-index-checkbox" key={idx++}>
      <this.CreateCollectionCheckbox
        name="Use Custom Collation"
        inputClassName="create-index-checkbox-input"
        titleClassName="create-index-collation-title"
        helpUrl={HELP_URL_COLLATION}
        onClickHandler={this.onCollationClicked.bind(this)}
        checked={this.state.isCustomCollation}
      />
    </div>);
    options.push(this.renderCollation(idx++));
    return options;
  }

  /**
   * Create React components for each selected field in the create index form.
   *
   * @returns {Array} The React components for each field, or null if none are selected.
   */
  getIndexFields() {
    if (!this.state.fields.length) {
      return null;
    }

    const disabledFields = pluck(this.state.fields, 'name');

    return this.state.fields.map((field, idx) => {
      return (<CreateIndexField
        fields={this.state.schemaFields}
        key={idx}
        idx={idx}
        field={field}
        disabledFields={disabledFields}
        isRemovable={!(this.state.fields.length > 1)} />);
    });
  }

  /**
   * Close modal and fire clear create index form action.
   */
  close() {
    Actions.clearForm();
    this.setState({inProgress: false, error: false, errorMessage: '', isCustomCollation: false});
    this.props.close();
  }

  /**
   * Close modal when cancel is clicked.
   */
  handleCancel() {
    Actions.updateStatus('cancel');
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
    Actions.triggerIndexCreation();
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
    this.setState({fields, options, schemaFields});
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
   * Fire add field action to add field and type to add index form.
   *
   * @param {Object} evt - The click event.
   */
  handleSubmit(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    Actions.addIndexField();
  }

/**
   * Render collation options when collation is selected.
   *
   * @returns {React.Component} The component.
   */
  renderCollation(id) {
    if (this.state.isCustomCollation) {
      return (
        <div className="create-collection-dialog-collation-div" key={id}>
          <this.CreateCollectionCollationSelect
            collation={this.state.options.collation || {}}
            onCollationOptionChange={this.onCollationOptionChange.bind(this)}
          />
        </div>
      );
    }
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
          data-test-id="create-index-button"
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
        onHide={this.close.bind(this)} >

        <div className="create-index-modal-content" data-test-id="create-index-modal">
          <Modal.Header>
            <Modal.Title>Create Index</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <form onSubmit={this.handleCreate.bind(this)}>
              <p className="create-index-description">Choose an index name</p>
              <CreateIndexTextField
                autoFocus
                isParam={false}
                option={'name'}
                dataTestId="create-index-modal-name"
                value={''}/>

              <div className="create-index-fields">
                <p className="create-index-description">Configure the index definition</p>
                {this.getIndexFields()}

                <div>
                  <button
                    onClick={this.handleSubmit.bind(this)}
                    className="create-index-field-add btn btn-primary btn-sm btn-full-width">
                    Add another field
                  </button>
                </div>
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
                <ModalStatusMessage icon="times" message={this.state.errorMessage} type="error" />
                : null}

              {this.state.inProgress ?
                <ModalStatusMessage icon="spinner" message={'Create in Progress'} type="in-progress" />
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
  open: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired
};

export default CreateIndexModal;
