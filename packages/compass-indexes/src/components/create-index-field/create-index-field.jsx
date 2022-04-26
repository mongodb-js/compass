import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import classnames from 'classnames';
import styles from './create-index-field.module.less';

import Select from 'react-select-plus';

/**
 * Current allowed types for indexes.
 */
const INDEX_TYPES = ['1 (asc)', '-1 (desc)', '2dsphere', 'text', 'columnar'];

/**
 * Default values for field name and type as presented in the UI
 */
const DEFAULT_FIELD = {
  name: 'Select or type a field name',
  type: 'Select a type',
};

/**
 * Component for the index field form.
 */
class CreateIndexField extends PureComponent {
  static displayName = 'CreateIndexField';

  static propTypes = {
    fields: PropTypes.array.isRequired,
    field: PropTypes.object.isRequired,
    idx: PropTypes.number.isRequired,
    disabledFields: PropTypes.array.isRequired,
    isRemovable: PropTypes.bool.isRequired,
    addField: PropTypes.func.isRequired,
    removeField: PropTypes.func.isRequired,
    updateFieldName: PropTypes.func.isRequired,
    updateFieldType: PropTypes.func.isRequired,
  };

  /**
   * Create React dropdown items for each element in the fields array.
   *
   * @returns {Array} The React components for each item in the field and type dropdowns.
   */
  getDropdownFieldsSelect() {
    return this.props.fields.map((elem) => ({
      value: elem,
      label: elem,
      disabled: this.props.disabledFields.some((field) => field === elem),
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
      label: elem,
    }));
  }

  /**
   * Set state to selected field on field change.
   *
   * @param {object} field - The selected field object.
   */
  selectFieldName(field) {
    if (field !== null) {
      this.props.updateFieldName(this.props.idx, field.label);
    }
  }

  /**
   * Set state to selected type on type change.
   *
   * @param {string} field - The selected field object.
   */
  selectFieldType(field) {
    this.props.updateFieldType(this.props.idx, field.label);
  }

  /**
   * Remove this index field
   *
   * @param {object} evt The click event.
   */
  remove(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.props.removeField(this.props.idx);
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
    const hasNameError = this.props.field.name !== '' ? '' : 'has-error';
    const hasTypeError = this.props.field.type !== '' ? '' : 'has-error';

    return (
      <div className={classnames(styles['create-index-field'])}>
        <div
          className={classnames(styles['create-index-field-dropdown-name'])}
          data-test-id="create-index-modal-field-select"
        >
          <Select.Creatable
            value={this.props.field.name}
            placeholder={DEFAULT_FIELD.name}
            options={this.getDropdownFieldsSelect(this.props.fields)}
            onChange={this.selectFieldName.bind(this)}
            clearable={false}
            promptTextCreator={this._promptText}
            className={hasNameError}
          />
        </div>
        <div
          className={classnames(styles['create-index-field-dropdown-type'])}
          data-test-id="create-index-modal-type-select"
        >
          <Select
            value={this.props.field.type}
            placeholder={DEFAULT_FIELD.type}
            options={this.getDropdownTypes()}
            onChange={this.selectFieldType.bind(this)}
            clearable={false}
            searchable={false}
            className={hasTypeError}
          />
        </div>
        <div>
          <button
            disabled={this.props.isRemovable}
            className="btn btn-primary btn-circle"
            onClick={this.remove.bind(this)}
          >
            <i className="fa fa-minus" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }
}

export default CreateIndexField;
