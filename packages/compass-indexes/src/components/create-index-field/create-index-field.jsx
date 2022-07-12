import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import styles from './create-index-field.module.less';
import { hasColumnstoreIndexesSupport } from '../../utils/has-columnstore-indexes-support';

import {
  Combobox,
  ComboboxOption,
  Select,
  Option,
} from '@mongodb-js/compass-components';

/**
 * Current allowed types for indexes.
 */
const INDEX_TYPES = ['1 (asc)', '-1 (desc)', '2dsphere', 'text', 'columnstore'];

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
    serverVersion: PropTypes.string.isRequired,
    disabledFields: PropTypes.array.isRequired,
    isRemovable: PropTypes.bool.isRequired,
    addField: PropTypes.func.isRequired,
    removeField: PropTypes.func.isRequired,
    updateFieldName: PropTypes.func.isRequired,
    updateFieldType: PropTypes.func.isRequired,
    newIndexField: PropTypes.string,
    createNewIndexField: PropTypes.func.isRequired,
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
    if (!hasColumnstoreIndexesSupport(this.props.serverVersion)) {
      return INDEX_TYPES.filter((elem) => elem !== 'columnstore').map(
        (elem) => (
          <Option key={elem} value={`${elem}`}>
            {elem}
          </Option>
        )
      );
    }

    return INDEX_TYPES.map((elem) => (
      <Option key={elem} value={`${elem}`}>
        {elem}
      </Option>
    ));
  }

  /**
   * Set state to selected field on name change.
   *
   * @param {object} name - The selected field name.
   */
  selectFieldName(name) {
    if (name !== null) {
      this.props.updateFieldName(this.props.idx, name);
    }
  }

  /**
   * Set state to selected field on type change.
   *
   * @param {string} type - The selected field type.
   */
  selectFieldType(type) {
    this.props.updateFieldType(this.props.idx, type);
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

  renderIndexOptions() {
    const fields = this.props.fields.map((value, idx) => (
      <ComboboxOption
        key={`combobox-option-${idx}`}
        value={value}
        displayName={value}
      />
    ));

    if (this.props.newIndexField) {
      const newIndexField = this.props.newIndexField;

      fields.push(
        <ComboboxOption
          key={`combobox-option-new`}
          value={newIndexField}
          displayName={`Create Index: ${newIndexField}`}
        />
      );
    }

    return fields;
  }

  /**
   * Render the index field form.
   *
   * @returns {React.Component} The index field form.
   */
  render() {
    return (
      <div className={styles['create-index-field']}>
        <div
          className={styles['create-index-field-dropdown-name']}
          data-test-id="create-index-modal-field-select"
        >
          <Combobox
            value={this.props.field.name}
            label="Index fields"
            placeholder={DEFAULT_FIELD.name}
            onFilter={this.props.createNewIndexField}
            onChange={this.selectFieldName.bind(this)}
            clearable={false}
          >
            {this.renderIndexOptions()}
          </Combobox>
        </div>
        <div
          className={styles['create-index-field-dropdown-type']}
          data-test-id="create-index-modal-type-select"
        >
          <Select
            name="field-type"
            className={styles['create-index-field-dropdown-type-select']}
            placeholder={DEFAULT_FIELD.type}
            onChange={this.selectFieldType.bind(this)}
            usePortal={false}
            allowDeselect={false}
            value={this.props.field.type}
            popoverZIndex={999999}
            aria-labelledby="Field Type"
          >
            {this.getDropdownTypes()}
          </Select>
        </div>
        <div className={styles['create-index-field-button']}>
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
