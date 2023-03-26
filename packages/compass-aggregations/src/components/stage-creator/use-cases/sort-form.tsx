import {
  Combobox,
  ComboboxOption,
  Select,
  Option,
  IconButton,
  Icon,
} from '@mongodb-js/compass-components';
import React from 'react';
import type { Field } from '.';
import type { Document } from 'mongodb';

type SortFormState = {
  field: string;
  direction: string;
};

export const mapSortFormToStageValue = (data: SortFormState[]) => {
  const sort: Document = {};
  data.forEach(({ field, direction }) => {
    sort[field] = direction === 'Asc' ? 1 : -1;
  });
  return sort;
};

export const SortForm = ({
  initialData = [
    {
      field: '',
      direction: '',
    },
  ],
  fields: schemaFields,
  onChange,
}: {
  initialData?: SortFormState[];
  fields: Field[];
  onChange: (sort: SortFormState[]) => void;
}) => {
  const onSelectField = (index: number, value: string | null) => {
    if (!value) return;
    const newSort = [...initialData];
    newSort[index].field = value;
    onChange(newSort);
  };
  const onSelectDirection = (index: number, value: string) => {
    const newSort = [...initialData];
    newSort[index].direction = value;
    onChange(newSort);
  };

  return (
    <div>
      {initialData.map((sort, index) => (
        <div
          key={`sort-form-${index}`}
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ width: '100px' }}>
            <Combobox
              aria-label="Select a field"
              size="default"
              clearable={false}
              initialValue={sort.field}
              onChange={(value: string | null) => onSelectField(index, value)}
            >
              {schemaFields.map(({ name, value }, index) => (
                <ComboboxOption
                  key={`combobox-option-stage-${index}`}
                  value={value}
                  displayName={name}
                />
              ))}
            </Combobox>
          </div>
          <p>in</p>
          <Select
            style={{ width: '100px' }}
            allowDeselect={false}
            aria-label="Select stage to edit"
            value={sort.direction}
            onChange={(value) => onSelectDirection(index, value)}
          >
            {['Asc', 'Desc'].map((label) => {
              return (
                <Option key={label} value={label}>
                  {label}
                </Option>
              );
            })}
          </Select>
          {/* Plus / Minus buttons */}
          <div>
            <IconButton
              aria-label="Add"
              onClick={() =>
                onChange([...initialData, { field: '', direction: '' }])
              }
            >
              <Icon glyph="Plus" />
            </IconButton>
            {initialData.length > 1 && (
              <IconButton
                aria-label="Remove"
                onClick={() =>
                  onChange(initialData.filter((_, i) => i !== index))
                }
              >
                <Icon glyph="Minus" />
              </IconButton>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
