import {
  css,
  Body,
  Icon,
  Select,
  Option,
  spacing,
  IconButton,
  ComboboxWithCustomOption,
} from '@mongodb-js/compass-components';
import React, { useState } from 'react';
import { sortBy } from 'lodash';
import type { Document } from 'mongodb';
import { mapFieldToPropertyName, mapFieldsToGroupId } from '../utils';

const STATISTIC_ACCUMULATORS = sortBy(
  [
    {
      label: 'Average',
      value: '$avg',
    },
    {
      label: 'Minimum',
      value: '$min',
    },
    {
      label: 'Standard Deviation',
      value: '$stdDevPop',
    },
    {
      label: 'Count',
      value: '$count',
    },
    {
      label: 'Maximum',
      value: '$max',
    },
    {
      label: 'Sum',
      value: '$sum',
    },
  ],
  'label'
);

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
});

const groupRowStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
});

const groupLabelStyles = css({
  width: '100px',
  textAlign: 'right',
});

const selectStyles = css({
  width: `${String(
    Math.max(...STATISTIC_ACCUMULATORS.map(({ label }) => label.length))
  )}ch`,
});
const comboboxStyles = css({ width: '300px' });

type GroupAccumulators = {
  field: string;
  accumulator: string;
};

type GroupWithStatisticsFormData = {
  groupFields: string[];
  groupAccumulators: GroupAccumulators[];
};

const _getGroupAccumulatorKey = ({ field, accumulator }: GroupAccumulators) => {
  // _id is by default the grouping key. So, we can not use this
  // field as an property name.
  if (field === '_id') {
    return `${accumulator.replace(/\$/g, '')}_id`;
  }
  return mapFieldToPropertyName(field);
};

const _getGroupAccumulatorValue = ({
  field,
  accumulator,
}: GroupAccumulators) => {
  return {
    [accumulator]: accumulator === '$count' ? {} : `$${field}`,
  };
};

const mapGroupFormStateToStageValue = (
  data: GroupWithStatisticsFormData
): Document => {
  const values = Object.fromEntries(
    data.groupAccumulators
      .filter((x) => x.accumulator && x.field)
      .map((x) => [_getGroupAccumulatorKey(x), _getGroupAccumulatorValue(x)])
  );
  return {
    _id: mapFieldsToGroupId(data.groupFields),
    ...values,
  };
};

const GroupAccumulatorForm = ({
  onChange,
  data,
  fields,
}: {
  onChange: (value: GroupAccumulators[]) => void;
  data: GroupAccumulators[];
  fields: string[];
}) => {
  const onChangeGroup = (
    index: number,
    key: keyof GroupAccumulators,
    value: string | null
  ) => {
    if (!value) {
      return;
    }
    const newData = [...data];
    newData[index][key] = value;
    onChange(newData);
  };

  const onAddGroup = (at: number) => {
    const newData = [...data];
    newData.splice(at + 1, 0, {
      field: '',
      accumulator: '',
    });
    onChange(newData);
  };

  const onRemoveGroup = (at: number) => {
    const newData = [...data];
    newData.splice(at, 1);
    onChange(newData);
  };

  return (
    <>
      {data.map(({ accumulator, field }, index) => {
        return (
          <div className={groupRowStyles} key={index}>
            <Body className={groupLabelStyles}>
              {index === 0 ? 'Calculate' : 'and'}
            </Body>
            {/* @ts-expect-error leafygreen unresonably expects a labelledby here */}
            <Select
              className={selectStyles}
              allowDeselect={false}
              aria-label={'Select accumulator'}
              value={accumulator}
              onChange={(value: string) =>
                onChangeGroup(index, 'accumulator', value)
              }
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
              value={field}
              onChange={(value: string | null) =>
                onChangeGroup(index, 'field', value)
              }
              options={fields}
              optionLabel="Field:"
            />
            <IconButton aria-label="Add" onClick={() => onAddGroup(index)}>
              <Icon glyph="Plus" />
            </IconButton>
            {data.length > 1 && (
              <IconButton
                aria-label="Remove"
                onClick={() => onRemoveGroup(index)}
              >
                <Icon glyph="Minus" />
              </IconButton>
            )}
          </div>
        );
      })}
    </>
  );
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
    groupAccumulators: [
      {
        field: '',
        accumulator: '',
      },
    ],
  });

  const onChangeValue = <T extends keyof GroupWithStatisticsFormData>(
    key: T,
    value: GroupWithStatisticsFormData[T]
  ) => {
    const newData = {
      ...formData,
      [key]: value,
    };
    setFormData(newData);

    const isValuesEmpty =
      newData.groupAccumulators.filter((x) => x.accumulator && x.field)
        .length === 0;
    onChange(
      JSON.stringify(mapGroupFormStateToStageValue(newData)),
      isValuesEmpty ? new Error('Select one group accumulator') : null
    );
  };

  return (
    <div className={containerStyles}>
      <GroupAccumulatorForm
        fields={fields}
        data={formData.groupAccumulators}
        onChange={(val) => onChangeValue('groupAccumulators', val)}
      />
      <div className={groupRowStyles}>
        <Body className={groupLabelStyles}>grouped by</Body>
        <ComboboxWithCustomOption<true>
          placeholder={'Select field names'}
          className={comboboxStyles}
          aria-label={'Select field names'}
          size="default"
          clearable={true}
          multiselect={true}
          value={formData.groupFields}
          onChange={(val: string[]) => onChangeValue('groupFields', val)}
          options={fields}
          optionLabel="Field:"
          overflow="scroll-x"
        />
      </div>
    </div>
  );
};

export default GroupWithStatistics;
