import React, { useCallback, useMemo } from 'react';
import { hasColumnstoreIndexesSupport } from '../utils/has-columnstore-indexes-support';

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

import type { IndexField } from '../modules/create-index/fields';

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

const comboboxStyles = css({
  marginTop: '-2px',
});

export type CreateIndexFieldsProps = {
  darkMode?: boolean;
  fields: IndexField[];
  schemaFields: string[];
  serverVersion: string;
  isRemovable: boolean;
  newIndexField: string | null;
  addField: () => void;
  createNewIndexField: (newField: string) => void;
  removeField: (idx: number) => void;
  updateFieldName: (idx: number, name: string) => void;
  updateFieldType: (idx: number, fType: string) => void;
};

function CreateIndexFields({
  fields,
  newIndexField,
  serverVersion,
  schemaFields,
  addField,
  createNewIndexField,
  removeField,
  updateFieldName,
  updateFieldType,
}: CreateIndexFieldsProps) {
  const serverHasColumnstoreIndexesSupport = useMemo(
    () => hasColumnstoreIndexesSupport(serverVersion),
    [serverVersion]
  );

  const onSelectFieldName = useCallback(
    (idx: number, name: string | null) => {
      if (name !== null) {
        updateFieldName(idx, name);
      }
    },
    [updateFieldName]
  );

  const comboboxOptions = useMemo(() => {
    const options = schemaFields.map((value, index) => (
      <ComboboxOption
        key={`combobox-option-${index}`}
        value={value}
        displayName={value}
      />
    ));

    if (newIndexField && !schemaFields.includes(newIndexField)) {
      options.push(
        <ComboboxOption
          key={`combobox-option-new`}
          value={newIndexField}
          displayName={`Create Index: ${newIndexField}`}
        />
      );
    }

    return options;
  }, [schemaFields, newIndexField]);

  return fields.map((field: IndexField, idx: number) => (
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
          id={`create-index-modal-field-${idx}`}
          placeholder={DEFAULT_FIELD.name}
          onFilter={createNewIndexField}
          onChange={(fieldName: string | null) =>
            onSelectFieldName(idx, fieldName)
          }
          clearable={false}
          className={comboboxStyles}
        >
          {comboboxOptions}
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
          onChange={(type) => updateFieldType(idx, type)}
          usePortal={false}
          allowDeselect={false}
          value={field.type}
          popoverZIndex={999999}
          aria-labelledby="Field type"
        >
          {(serverHasColumnstoreIndexesSupport
            ? INDEX_TYPES
            : INDEX_TYPES.filter((elem) => elem !== 'columnstore')
          ).map((elem) => (
            <Option key={elem} value={`${elem}`}>
              {elem}
            </Option>
          ))}
        </Select>
      </div>
      <div className={createIndexFieldsButtonsStyles}>
        <IconButton
          className={addFieldButtonStyles}
          aria-label="Add new index field"
          type="button"
          data-testid="add-index-field-button"
          onClick={addField}
        >
          <Icon glyph="Plus" />
        </IconButton>
        {fields.length > 1 && (
          <IconButton
            className={addFieldButtonStyles}
            aria-label="Remove index field"
            type="button"
            data-testid="remove-index-field-button"
            onClick={() => removeField(idx)}
          >
            <Icon glyph="Minus" />
          </IconButton>
        )}
      </div>
    </div>
  ));
}

export { CreateIndexFields };
