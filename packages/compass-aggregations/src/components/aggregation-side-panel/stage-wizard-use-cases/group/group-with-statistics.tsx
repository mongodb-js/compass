import {
  Body,
  spacing,
  css,
  Select,
  Option,
  ComboboxWithCustomOption,
} from '@mongodb-js/compass-components';
import React, { useState } from 'react';
import type { Document } from 'mongodb';

const STATISTIC_ACCUMULATORS = [
  {
    label: 'Average',
    value: 'avg',
  },
  {
    label: 'Sum',
    value: 'sum',
  },
  {
    label: 'Count',
    value: 'count',
  },
] as const;

const containerStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
});

const selectStyles = css({ minWidth: '120px' });
const comboboxStyles = css({ width: '300px' });

const sanitizeFieldName = (name: string): string => {
  return name.replace(/\./g, '_');
};

const mapGroupFormStateToStageValue = (
  data: GroupWithStatisticsFormData
): Document => {
  return {
    _id: data.groupFields
      ? Object.fromEntries(
          data.groupFields.map((x) => [sanitizeFieldName(x), `$${x}`])
        )
      : null,
    [sanitizeFieldName(data.projectionField)]: {
      [`$${data.accumulator}`]: `$${data.projectionField}`,
    },
  };
};

type GroupWithStatisticsFormData = {
  groupFields?: string[];
  projectionField: string;
  accumulator: string;
};

export const GroupWithStatistics = ({
  fields,
  onChange,
}: {
  fields: string[];
  onChange: (value: string, error: Error | null) => void;
}) => {
  const [formData, setFormData] = useState<GroupWithStatisticsFormData>({
    groupFields: [],
    projectionField: '',
    accumulator: '',
  });

  const onChangeFields = (
    key: keyof GroupWithStatisticsFormData,
    data: string | string[] | null
  ) => {
    if (!data) {
      return;
    }
    const newFormData = { ...formData, [key]: data };
    setFormData(newFormData);

    onChange(
      JSON.stringify(mapGroupFormStateToStageValue(newFormData)),
      !newFormData.projectionField || !newFormData.accumulator
        ? new Error('Select a field and an accumulator')
        : null
    );
  };

  return (
    <div className={containerStyles}>
      <Body>Calculate</Body>
      {/* @ts-expect-error leafygreen unresonably expects a labelledby here */}
      <Select
        className={selectStyles}
        allowDeselect={false}
        aria-label={'Select accumulator'}
        onChange={(value: string) => onChangeFields('accumulator', value)}
      >
        {STATISTIC_ACCUMULATORS.map((x, i) => {
          return (
            <Option value={x.value} key={i}>
              {x.label}
            </Option>
          );
        })}
      </Select>
      <Body>of</Body>
      <ComboboxWithCustomOption
        className={comboboxStyles}
        aria-label="Select a field"
        size="default"
        clearable={false}
        value={formData.projectionField}
        onChange={(value: string | null) =>
          onChangeFields('projectionField', value)
        }
        options={fields}
        optionLabel="Field:"
      />
      <Body>grouped by</Body>
      <ComboboxWithCustomOption<true>
        placeholder={'Select field names'}
        className={comboboxStyles}
        aria-label={'Select field names'}
        size="default"
        clearable={true}
        multiselect={true}
        value={formData.groupFields}
        onChange={(val: string[]) => onChangeFields('groupFields', val)}
        options={fields}
        optionLabel="Field:"
        overflow="scroll-x"
      />
    </div>
  );
};

export default GroupWithStatistics;
