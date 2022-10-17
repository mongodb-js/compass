import React, { useCallback, useMemo } from 'react';
import { hasColumnstoreIndexesSupport } from '../utils/has-columnstore-indexes-support';

import {
  Combobox,
  ComboboxOption,
  Select,
  Option,
  spacing,
  css,
  ListEditor,
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

const createIndexFieldsStyles = css({
  display: 'flex',
  gap: spacing[2],
});

const createIndexFieldsNameStyles = css({
  flexGrow: 1,
  textTransform: 'none',
  whiteSpace: 'nowrap',
});

const createIndexFieldsTypeStyles = css({
  flexGrow: 1,
  textTransform: 'none',
  whiteSpace: 'nowrap',
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
}: CreateIndexFieldsProps): React.ReactElement {
  const serverHasColumnstoreIndexesSupport = useMemo(
    () => hasColumnstoreIndexesSupport(serverVersion),
    [serverVersion]
  );

  const onSelectFieldName = useCallback(
    (index: number, name: string | null) => {
      if (name !== null) {
        updateFieldName(index, name);
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

  return (
    <ListEditor
      items={fields}
      renderItem={(field: IndexField, index: number) => (
        <div
          className={createIndexFieldsStyles}
          data-testid={`create-index-fields-line-${index}`}
        >
          <div
            className={createIndexFieldsNameStyles}
            data-testid={`create-index-fields-name-${index}`}
          >
            <Combobox
              value={field.name}
              aria-label="Index fields"
              placeholder={DEFAULT_FIELD.name}
              onFilter={createNewIndexField}
              onChange={(fieldName: string | null) =>
                onSelectFieldName(index, fieldName)
              }
              clearable={false}
            >
              {comboboxOptions}
            </Combobox>
          </div>
          <div
            className={createIndexFieldsTypeStyles}
            data-testid={`create-index-fields-type-${index}`}
          >
            <Select
              id={`create-index-fields-type-select-${index}`}
              placeholder={DEFAULT_FIELD.type}
              onChange={(type) => updateFieldType(index, type)}
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
        </div>
      )}
      onAddItem={addField}
      onRemoveItem={removeField}
      addButtonTestId="add-index-field-button"
      removeButtonTestId="remove-index-field-button"
    />
  );
}

export { CreateIndexFields };
