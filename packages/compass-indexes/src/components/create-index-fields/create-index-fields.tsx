import React, { Component } from 'react';
import type { ReactElement } from 'react';
import { hasColumnstoreIndexesSupport } from '../../utils/has-columnstore-indexes-support';

import {
  Combobox,
  ComboboxOption,
  Select,
  Option,
  IconButton,
  spacing,
  css,
  cx,
  Icon,
  palette,
  withTheme,
} from '@mongodb-js/compass-components';

import type { IndexField } from '../../modules/create-index/fields';

// Inject types that the ComboboxOption component accepts.
// Otherwise, ComboboxOption causes
// the `Property 'value' does not exist on type 'IntrinsicAttributes'` error.
const ComboboxOptionTyped =
  ComboboxOption as unknown as React.JSXElementConstructor<{
    value?: string;
    displayName?: string;
    glyph?: ReactElement;
    className?: string;
  }>;

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

const addFieldButtonStyles = css({
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
  width: +spacing[7] * 3 + +spacing[6],
  textTransform: 'none',
  marginRight: spacing[2],
  whiteSpace: 'nowrap',
  input: {
    outline: 'none',
    width: '100%',
  },
});

const createIndexFieldsTypeStyles = css({
  width: +spacing[7] * 2 + +spacing[3],
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

const comboboxOptionDarkStyles = css({
  color: palette.white,
  backgroundColor: palette.gray.dark2,
  ':first-child': {
    backgroundColor: palette.gray.dark2,
  },
  ':hover': {
    backgroundColor: palette.gray.dark1,
  },
});

const comboboxStyles = css({
  marginTop: '-2px',
});

const comboboxDarkStyles = css({
  color: palette.white,
  backgroundColor: palette.gray.dark2,
  border: `1px solid ${palette.gray.dark2}`,
});

export type CreateIndexFieldsProps = {
  darkMode?: boolean;
  fields: IndexField[];
  schemaFields: string[];
  serverVersion: string;
  isRemovable: boolean;
  newIndexField: string | null;
  addField: () => void;
  removeField: (idx: number) => void;
  updateFieldName: (idx: number, name: string) => void;
  updateFieldType: (idx: number, fType: string) => void;
  createNewIndexField: (newField: string) => void;
};

/**
 * Component for the index fields.
 */
class CreateIndexFields extends Component<CreateIndexFieldsProps> {
  static displayName = 'CreateIndexFields';

  /**
   * Create React dropdown items for each element in the INDEX_TYPES array.
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
   */
  selectFieldName(idx: number, name: string | null) {
    if (name !== null) {
      this.props.updateFieldName(idx, name);
    }
  }

  /**
   * Set state to selected field on type change.
   */
  selectFieldType(idx: number, type: string) {
    this.props.updateFieldType(idx, type);
  }

  /**
   * Remove this index field
   */
  remove(idx: number, evt: React.FormEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.props.removeField(idx);
  }

  /**
   * Render combobox options.
   */
  renderIndexOptions() {
    const fields = this.props.schemaFields.map((value, idx) => (
      <ComboboxOptionTyped
        className={this.props.darkMode ? comboboxOptionDarkStyles : ''}
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
        <ComboboxOptionTyped
          className={this.props.darkMode ? comboboxOptionDarkStyles : ''}
          key={`combobox-option-new`}
          value={newIndexField}
          displayName={`Create Index: ${newIndexField}`}
        />
      );
    }

    return fields;
  }

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
            darkMode={this.props.darkMode}
            className={cx(
              comboboxStyles,
              this.props.darkMode ? comboboxDarkStyles : ''
            )}
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
            className={addFieldButtonStyles}
            aria-label="Add new index field"
            type="button"
            data-testid="add-index-field-button"
            onClick={this.props.addField.bind(this)}
          >
            <Icon glyph="Plus" />
          </IconButton>
          {this.props.fields.length > 1 && (
            <IconButton
              className={addFieldButtonStyles}
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

export default withTheme(CreateIndexFields);
