import {
  Combobox,
  ComboboxOption,
  Select,
  Option,
  TextInput,
} from '@mongodb-js/compass-components';
import React from 'react';
import { connect } from 'react-redux';
import type { Field } from '.';
import type { RootState } from '../../../modules';
import { ACCUMULATORS } from '@mongodb-js/mongodb-constants';
import { gte } from 'semver';

const USE_CASE_ACCUMULATORS = [
  '$top',
  '$topN',
  '$bottom',
  '$bottomN',
  '$first',
  '$firstN',
  '$last',
  '$lastN',
];

const GROUP_OPERATORS = ACCUMULATORS.filter((x) =>
  USE_CASE_ACCUMULATORS.includes(x.value)
);

type GroupSubsetFormState = {
  groupFields: string[];
  accumulator: string;
  accumulatorField: string;
  accumulatorN: string;
};

export const mapGroupSubsetFormToStageValue = (data: GroupSubsetFormState) => {
  return {
    _id: data.groupFields.reduce((acc, field) => {
      acc[field] = 1;
      return acc;
    }, {} as Record<string, number>),
    [data.accumulator]: {
      n: data.accumulatorN,
      output: data.accumulatorField,
      sort: {},
    },
  };
};

const BaseGroupSubsetForm = ({
  initialData = {
    groupFields: [],
    accumulator: '',
    accumulatorField: '',
    accumulatorN: '1',
  },
  fields: schemaFields,
  onChange,
  serverVersion,
}: {
  initialData?: GroupSubsetFormState;
  fields: Field[];
  onChange: (sort: GroupSubsetFormState) => void;
  serverVersion: string;
}) => {
  const OPERATORS = React.useMemo(() => {
    return GROUP_OPERATORS.filter(({ version }) => {
      return gte(serverVersion, version);
    });
  }, [serverVersion]);

  const onChangeItem = (key: keyof GroupSubsetFormState, value: any) => {
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
      <p>Return the</p>
      <Select
        style={{ width: '100px' }}
        allowDeselect={false}
        aria-label="Calculate"
        value={initialData.accumulator}
        onChange={(value) => onChangeItem('accumulator', value)}
      >
        {OPERATORS.map(({ name, value }) => {
          return (
            <Option key={value} value={value}>
              {name}
            </Option>
          );
        })}
      </Select>
      <TextInput
        aria-label="Value"
        placeholder="Value"
        value={initialData.accumulatorN}
        type="number"
        onChange={(value) => onChangeItem('accumulatorN', value.target.value)}
      />
      <p>from a group of </p>
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

const GroupSubsetForm = connect((state: RootState) => {
  return {
    serverVersion: state.serverVersion,
  };
})(BaseGroupSubsetForm);

GroupSubsetForm.validateData = (data: GroupSubsetFormState) => {
  if (data.groupFields.length === 0) {
    throw new Error('Please select at least one field');
  }
};

export { GroupSubsetForm };
