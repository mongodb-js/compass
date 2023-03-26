import {
  Combobox,
  ComboboxOption,
  Select,
  Option,
} from '@mongodb-js/compass-components';
import React from 'react';
import type { Field } from '.';

const GROUP_OPERATORS = [
  { label: 'Sum', value: '$sum' },
  { label: 'Avg', value: '$avg' },
  { label: 'stdDev', value: '$stddev' },
];

type GroupFormState = {
  groupFields: string[];
  accumulator: string;
  accumulatorField: string;
};

export const mapGroupFormToStageValue = (data: GroupFormState) => {
  return {
    _id: data.groupFields.reduce((acc, field) => {
      acc[field] = 1;
      return acc;
    }, {} as Record<string, number>),
    [data.accumulatorField]: {
      [data.accumulator]: `$${data.accumulatorField}`,
    },
  };
};

export const GroupForm = ({
  initialData = {
    groupFields: [],
    accumulator: '',
    accumulatorField: '',
  },
  fields: schemaFields,
  onChange,
}: {
  initialData?: GroupFormState;
  fields: Field[];
  onChange: (sort: GroupFormState) => void;
}) => {
  const onChangeItem = (key: keyof GroupFormState, value: any) => {
    const newData = { ...initialData, [key]: value };
    onChange(newData);
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
      }}
    >
      <p>Calculate</p>
      <Select
        style={{ width: '100px' }}
        allowDeselect={false}
        aria-label="Calculate"
        value={initialData.accumulator}
        onChange={(value) => onChangeItem('accumulator', value)}
      >
        {GROUP_OPERATORS.map(({ label, value }) => {
          return (
            <Option key={label} value={value}>
              {label}
            </Option>
          );
        })}
      </Select>
      <p>of</p>
      <div style={{ minWidth: '100px' }}>
        <Combobox
          aria-label="Select a field"
          size="default"
          clearable={false}
          initialValue={initialData.groupFields}
          onChange={(value: string[]) =>
            onChangeItem('accumulatorField', value)
          }
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
      <p>grouped by</p>
      <div style={{ minWidth: '100px' }}>
        <Combobox
          aria-label="Select a field"
          size="default"
          clearable={false}
          multiselect
          initialValue={initialData.groupFields}
          onChange={(value: string[]) => onChangeItem('groupFields', value)}
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
    </div>
  );
};
