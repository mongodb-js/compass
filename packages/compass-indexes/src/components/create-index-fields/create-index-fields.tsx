import React, { Component } from 'react';
import { hasColumnstoreIndexesSupport } from '../../utils/has-columnstore-indexes-support';

import {
  Combobox,
  ComboboxOption,
  Select,
  Option,
  IconButton,
  spacing,
  css,
  Icon,
} from '@mongodb-js/compass-components';

/**
 * Current allowed types for indexes.
 */
const INDEX_TYPES = ['1 (asc)', '-1 (desc)', '2dsphere', 'text', 'columnstore'];

/**
 * Default values for field name and type as presented in the UI.
 */
const DEFAULT_FIELD = {
  name: 'Select or type a field name',
  type: 'Select a type',
};

const hostActionButtonStyles = css({
  marginLeft: spacing[1],
  marginTop: spacing[1],
});

const createIndexFieldsStyles = css({
  display: 'flex',
  justifyContent: 'stretch',
  marginBottom: spacing[2],
  marginTop: spacing[1],
});

const createIndexFieldsNameStyles = css({
  width: `${spacing[7] * 3 + spacing[6]}px`,
  textTransform: 'none',
  marginRight: spacing[2],
  whiteSpace: 'nowrap',
  input: {
    outline: 'none',
    width: '100%',
  },
});

const createIndexFieldsTypeStyles = css({
  width: `${spacing[7] * 2 + spacing[3]}px`,
  textTransform: 'none',
  marginRight: spacing[2],
  whiteSpace: 'nowrap',
});

const createIndexFieldsTypeSelectStyles = css({
  zIndex: 1,
  button: {
    marginTop: 0,
  },
  'button:focus, button:focus-within': {
    zIndex: 20,
  },
});

const createIndexFieldsButtonsStyles = css({
  display: 'flex',
  justifyContent: 'end',
});

type IndexField = { name: string; type: string };

export type CreateIndexFieldsProps = {
  fields: IndexField[];
  schemaFields: string[];
  serverVersion: string;
  isRemovable: boolean;
  newIndexField?: string;
  // TODO: Refactor modules to get rid of return any.
  addField: () => any;
  removeField: (idx: number) => any;
  updateFieldName: (idx: number, name: string) => any;
  updateFieldType: (idx: number, fType: string) => any;
  createNewIndexField: (newField: string) => any;
};

/**
 * Component for the index field form.
 */
class CreateIndexFields extends Component<CreateIndexFieldsProps> {
  static displayName = 'CreateIndexFields';

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
   * @param {string} name - The selected field name.
   */
  selectFieldName(idx: number, name: string | null) {
    if (name !== null) {
      this.props.updateFieldName(idx, name);
    }
  }

  /**
   * Set state to selected field on type change.
   *
   * @param {string} type - The selected field type.
   */
  selectFieldType(idx: number, type: string) {
    this.props.updateFieldType(idx, type);
  }

  /**
   * Remove this index field
   *
   * @param {object} evt The click event.
   */
  remove(idx: number, evt: React.FormEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.props.removeField(idx);
  }

  renderIndexOptions() {
    const fields = this.props.schemaFields.map((value, idx) => (
      <ComboboxOption
        key={`combobox-option-${idx}`}
        value={value}
        displayName={value}
      />
    ));

    if (
      this.props.newIndexField &&
      !this.props.schemaFields.includes(this.props.newIndexField)
    ) {
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
    return this.props.fields.map((field: IndexField, idx: number) => (
      <div
        className={createIndexFieldsStyles}
        key={idx}
        data-testid={`create-index-fields-line-${idx}`}
      >
        <div
          className={createIndexFieldsNameStyles}
          data-testid={`create-index-fields-name-${idx}`}
        >
          <Combobox
            value={field.name}
            aria-label="Index fields"
            aria-labelledby="Index fields"
            placeholder={DEFAULT_FIELD.name}
            onFilter={this.props.createNewIndexField}
            onChange={this.selectFieldName.bind(this, idx)}
            clearable={false}
          >
            {this.renderIndexOptions()}
          </Combobox>
        </div>
        <div
          className={createIndexFieldsTypeStyles}
          data-testid={`create-index-fields-type-${idx}`}
        >
          <Select
            id={`create-index-fields-type-select-${idx}`}
            className={createIndexFieldsTypeSelectStyles}
            placeholder={DEFAULT_FIELD.type}
            onChange={this.selectFieldType.bind(this, idx)}
            usePortal={false}
            allowDeselect={false}
            value={field.type}
            popoverZIndex={999999}
            aria-labelledby="Field type"
          >
            {this.getDropdownTypes()}
          </Select>
        </div>
        <div className={createIndexFieldsButtonsStyles}>
          <IconButton
            className={hostActionButtonStyles}
            aria-label="Add new index field"
            type="button"
            data-testid="add-index-field-button"
            onClick={this.props.addField.bind(this)}
          >
            <Icon glyph="Plus" />
          </IconButton>
          {this.props.fields.length > 1 && (
            <IconButton
              className={hostActionButtonStyles}
              aria-label="Remove index field"
              type="button"
              data-testid="remove-index-field-button"
              onClick={this.remove.bind(this, idx)}
            >
              <Icon glyph="Minus" />
            </IconButton>
          )}
        </div>
      </div>
    ));
  }
}

export default CreateIndexFields;
