import React from 'react';
import PropTypes from 'prop-types';
import { DDLStatusStore } from 'stores';
import Actions from 'actions';

const Select = require('react-select-plus').default; // TODO

// const debug = require('debug')('mongodb-compass:indexes:create-index-field');

/**
 * Current allowed types for indexes.
 */
const INDEX_TYPES = ['1 (asc)', '-1 (desc)', '2dsphere'];

/**
 * Default values for field name and type as presented in the UI
 */
const DEFAULT_FIELD = {
  name: 'Select a field name',
  type: 'Select a type'
};

/**
 * Component for the index field form.
 */
class CreateIndexField extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      hasStartedValidating: false,
      isNameValid: true,
      isTypeValid: true
    };
  }

  componentDidMount() {
    this._unsubscribeStatusStore = DDLStatusStore.listen(this.statusChanged.bind(this));
  }

  componentWillReceiveProps() {
    this.validate(false);
  }

  componentWillUnmount() {
    this._unsubscribeStatusStore();
  }

  /**
   * Create React dropdown items for each element in the fields array.
   *
   * @returns {Array} The React components for each item in the field and type dropdowns.
   */
  getDropdownFieldsSelect() {
    return this.props.fields.map((elem) => ({
      value: elem,
      label: elem,
      disabled: this.props.disabledFields.some(field => (field === elem))
    }));
  }

  /**
   * Create React dropdown items for each element in the INDEX_TYPES array.
   *
   * @returns {Array} The React components for each item in the field and type dropdowns.
   */
  getDropdownTypes() {
    return INDEX_TYPES.map((elem) => ({
      value: elem,
      label: elem
    }));
  }

  /**
   * Set state to selected field on field change.
   *
   * @param {object} field - The selected field object.
   */
  selectFieldName(field) {
    Actions.updateFieldName(this.props.idx, field.label);
  }

  /**
   * Set state to selected type on type change.
   *
   * @param {string} field - The selected field object.
   */
  selectFieldType(field) {
    Actions.updateFieldType(this.props.idx, field.label);
  }

  /**
   * Remove this index field
   *
   * @param {object} evt The click event.
   */
  remove(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    Actions.removeIndexField(this.props.idx);
  }

  statusChanged() {
    this.validate(true);
  }

  validate(force) {
    if (!force && !this.state.hasStartedValidating) {
      return;
    }
    this.setState({
      hasStartedValidating: true,
      isTypeValid: this.props.field.type !== '',
      isNameValid: this.props.field.name !== ''
    });
  }

  _promptText(label) {
    return `Create Index: '${label}'`;
  }

  /**
   * Render the index field form.
   *
   * @returns {React.Component} The index field form.
   */
  render() {
    const hasNameError = this.state.isNameValid ? '' : 'has-error';
    const hasTypeError = this.state.isTypeValid ? '' : 'has-error';

    return (
      <div className="form-inline create-index-field">
        <div className="create-index-field-dropdown-name" data-test-id="create-index-modal-field-select">
          <Select.Creatable
            value={this.props.field.name}
            placeholder={DEFAULT_FIELD.name}
            options={this.getDropdownFieldsSelect(this.props.fields)}
            onChange={this.selectFieldName.bind(this)}
            clearable={false}
            promptTextCreator={this._promptText}
            className={hasNameError} />
        </div>
        <div className="create-index-field-dropdown-type" data-test-id="create-index-modal-type-select">
          <Select
            value={this.props.field.type}
            placeholder={DEFAULT_FIELD.type}
            options={this.getDropdownTypes(INDEX_TYPES)}
            onChange={this.selectFieldType.bind(this)}
            clearable={false}
            searchable={false}
            className={hasTypeError} />
        </div>
        <div>
          <button disabled={this.props.isRemovable}
            className="btn btn-primary btn-circle"
            onClick={this.remove.bind(this)}>
            <i className="fa fa-minus" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    );
  }
}

CreateIndexField.displayName = 'CreateIndexField';

CreateIndexField.propTypes = {
  fields: PropTypes.array.isRequired,
  field: PropTypes.object.isRequired,
  idx: PropTypes.number.isRequired,
  disabledFields: PropTypes.array.isRequired,
  isRemovable: PropTypes.bool.isRequired
};

export default CreateIndexField;
