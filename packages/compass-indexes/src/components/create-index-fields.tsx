import React, { useCallback, useMemo } from 'react';
import { hasColumnstoreIndexesSupport } from '../utils/columnstore-indexes';

import {
  ComboboxWithCustomOption,
  ComboboxOption,
  Select,
  Option,
  spacing,
  css,
  ListEditor,
  Badge,
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
  textTransform: 'none',
  whiteSpace: 'nowrap',
});

export type CreateIndexFieldsProps = {
  fields: IndexField[];
  schemaFields: string[];
  serverVersion: string;
  isRemovable: boolean;
  addField: () => void;
  removeField: (idx: number) => void;
  updateFieldName: (idx: number, name: string) => void;
  updateFieldType: (idx: number, fType: string) => void;
};

function CreateIndexFields({
  fields,
  serverVersion,
  schemaFields,
  addField,
  removeField,
  updateFieldName,
  updateFieldType,
}: CreateIndexFieldsProps): React.ReactElement {
  const [indexTypes, selectorWidth] = useMemo(() => {
    const serverSupportsColumnStoreIndex =
      hasColumnstoreIndexesSupport(serverVersion);
    const indexTypes = INDEX_TYPES.filter(
      (type) => serverSupportsColumnStoreIndex || type !== 'columnstore'
    );
    const longestLabel = Math.max(...INDEX_TYPES.map((type) => type.length));
    const additionalSpacing =
      spacing[6] +
      // For the preview badge
      (serverSupportsColumnStoreIndex ? spacing[6] : 0);

    const selectorWidth = `calc(${longestLabel}ch + ${additionalSpacing}px)`;
    return [indexTypes, selectorWidth];
  }, [serverVersion]);

  const onSelectFieldName = useCallback(
    (index: number, name: string | null) => {
      if (name !== null) {
        updateFieldName(index, name);
      }
    },
    [updateFieldName]
  );

  const comboboxOptions = schemaFields.map((value) => ({ value }));

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
            <ComboboxWithCustomOption
              aria-label="Index fields"
              placeholder={DEFAULT_FIELD.name}
              size="default"
              clearable={false}
              overflow="scroll-x"
              onChange={(fieldName: string | null) =>
                onSelectFieldName(index, fieldName)
              }
              options={comboboxOptions}
              renderOption={(option, index, isCustom) => {
                return (
                  <ComboboxOption
                    key={`field-option-${index}`}
                    value={option.value}
                    displayName={
                      isCustom ? `Field: "${option.value}"` : option.value
                    }
                  />
                );
              }}
            />
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
              style={{ width: selectorWidth }}
            >
              {indexTypes.map((type) => (
                <Option key={type} value={type}>
                  {type}
                  {type === 'columnstore' && (
                    <>
                      &nbsp;<Badge>Preview</Badge>
                    </>
                  )}
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
