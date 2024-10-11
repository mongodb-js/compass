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

import type { Field } from '../modules/create-index';

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
  fields: Field[];
  schemaFields: string[];
  serverVersion: string;
  isRemovable: boolean;
  onAddFieldClick: () => void;
  onRemoveFieldClick: (idx: number) => void;
  onSelectFieldNameClick: (idx: number, name: string) => void;
  onSelectFieldTypeClick: (idx: number, fType: string) => void;
};

function CreateIndexFields({
  fields,
  serverVersion,
  schemaFields,
  onAddFieldClick,
  onRemoveFieldClick,
  onSelectFieldNameClick,
  onSelectFieldTypeClick,
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
        onSelectFieldNameClick(index, name);
      }
    },
    [onSelectFieldNameClick]
  );

  const comboboxOptions = schemaFields.map((value) => ({ value }));

  return (
    <ListEditor
      items={fields}
      renderItem={(field: Field, index: number) => (
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
              onChange={(type) => onSelectFieldTypeClick(index, type)}
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
      onAddItem={onAddFieldClick}
      onRemoveItem={onRemoveFieldClick}
      addButtonTestId="add-index-field-button"
      removeButtonTestId="remove-index-field-button"
    />
  );
}

export { CreateIndexFields };
