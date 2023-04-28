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
import React, { useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { sortBy } from 'lodash';
import { ACCUMULATORS as MDB_ACCUMULATORS } from '@mongodb-js/mongodb-constants';
import type { Document } from 'mongodb';
import semver from 'semver';
import { mapFieldToPropertyName, mapFieldsToGroupId } from '../utils';
import type { RootState } from '../../../../modules';

const GROUP_FIELDS_LABEL = 'Select field names';
const ACCUMULATOR_FIELD_LABEL = 'Select a field name';

type StatisticAccumulator = {
  label: string;
  value: typeof MDB_ACCUMULATORS[number]['value'];
};
type Accumulator = StatisticAccumulator & {
  version: string;
};

const STATISTIC_ACCUMULATORS: StatisticAccumulator[] = [
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
];
const ACCUMULATORS = sortBy(STATISTIC_ACCUMULATORS, 'label')
  .map((acc) => {
    const source = MDB_ACCUMULATORS.find((x) => x.value === acc.value);
    if (source) {
      return {
        ...acc,
        version: source.version,
      };
    }
    return false;
  })
  .filter(Boolean) as Accumulator[];

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
  width: 'max-content',
  maxWidth: '100%',
});

const groupRowStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
});

const groupLabelStyles = css({
  minWidth: '100px',
  textAlign: 'right',
});

const selectStyles = css({
  width: `${String(
    Math.max(...ACCUMULATORS.map(({ label }) => label.length))
  )}ch`,
});
const accumulatorFieldcomboboxStyles = css({ width: '300px' });
const groupFieldscomboboxStyles = css({ width: '100%' });

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
  fields,
  serverVersion,
  data,
  onChange,
}: {
  fields: string[];
  serverVersion: string;
  data: GroupAccumulators[];
  onChange: (value: GroupAccumulators[]) => void;
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

  const accumulators = useMemo(
    () => ACCUMULATORS.filter((x) => semver.gte(serverVersion, x.version)),
    [serverVersion]
  );

  return (
    <div className={containerStyles}>
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
              {accumulators.map((x, i) => {
                return (
                  <Option value={x.value} key={i}>
                    {x.label}
                  </Option>
                );
              })}
            </Select>
            <Body>of</Body>
            <ComboboxWithCustomOption
              className={accumulatorFieldcomboboxStyles}
              aria-label={ACCUMULATOR_FIELD_LABEL}
              placeholder={ACCUMULATOR_FIELD_LABEL}
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
    </div>
  );
};

export const GroupWithStatistics = ({
  fields,
  serverVersion,
  onChange,
}: {
  fields: string[];
  serverVersion: string;
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
        serverVersion={serverVersion}
        fields={fields}
        data={formData.groupAccumulators}
        onChange={(val) => onChangeValue('groupAccumulators', val)}
      />
      <div className={groupRowStyles}>
        <Body className={groupLabelStyles}>grouped by</Body>
        <ComboboxWithCustomOption<true>
          className={groupFieldscomboboxStyles}
          aria-label={GROUP_FIELDS_LABEL}
          placeholder={GROUP_FIELDS_LABEL}
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

export default connect(({ serverVersion }: RootState) => ({
  serverVersion,
}))(GroupWithStatistics);
