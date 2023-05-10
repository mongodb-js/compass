import {
  css,
  Body,
  Select,
  Option,
  spacing,
  ListEditor,
} from '@mongodb-js/compass-components';
import React, { useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { sortBy } from 'lodash';
import { ACCUMULATORS as MDB_ACCUMULATORS } from '@mongodb-js/mongodb-constants';
import type { Document } from 'mongodb';
import semver from 'semver';
import {
  getNextId,
  mapFieldToPropertyName,
  mapFieldsToAccumulatorValue,
} from '../utils';
import type { RootState } from '../../../../modules';
import type { WizardComponentProps } from '..';
import { FieldCombobox } from '../field-combobox';
import type { TypeCastTypes } from 'hadron-type-checker';

const NUMERIC_TYPES: TypeCastTypes[] = [
  'Decimal128',
  'Double',
  'Int32',
  'Int64',
];

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

type GroupOwnProps = WizardComponentProps;
type MapStateProps = { serverVersion: string };

type GroupAccumulators = {
  id: number;
  field: string;
  accumulator: string;
};

type GroupWithStatisticsFormData = {
  groupFields: string[];
  groupAccumulators: GroupAccumulators[];
};

const _getGroupAccumulatorKey = ({ field, accumulator }: GroupAccumulators) => {
  // we will always prepend an accumulator to the key as user
  // can choose to calculate values of the same field in a document.
  const prefix = accumulator.replace(/\$/g, '');
  const propertyName = mapFieldToPropertyName(field);
  const underscore = propertyName.startsWith('_') ? '' : '_';
  return [prefix, underscore, propertyName].join('');
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
    _id: mapFieldsToAccumulatorValue(data.groupFields),
    ...values,
  };
};

const GroupAccumulatorForm = ({
  fields,
  serverVersion,
  data,
  onChange,
}: {
  fields: WizardComponentProps['fields'];
  serverVersion: string;
  data: GroupAccumulators[];
  onChange: (value: GroupAccumulators[]) => void;
}) => {
  const onChangeGroup = <T extends keyof GroupAccumulators>(
    index: number,
    key: T,
    value: GroupAccumulators[T] | null
  ) => {
    if (!value) {
      return;
    }
    const newData = [...data];
    newData[index][key] = value;
    onChange(newData);
  };

  const onAddItem = (at: number) => {
    const newData = [...data];
    newData.splice(at + 1, 0, {
      id: getNextId(),
      field: '',
      accumulator: '',
    });
    onChange(newData);
  };

  const onRemoveItem = (at: number) => {
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
      <ListEditor
        items={data}
        onAddItem={(index) => onAddItem(index)}
        onRemoveItem={(index) => onRemoveItem(index)}
        itemKey={(item) => String(item.id)}
        renderItem={(item, index) => {
          return (
            <div className={groupRowStyles}>
              <Body className={groupLabelStyles}>
                {index === 0 ? 'Calculate' : 'and'}
              </Body>
              {/* @ts-expect-error leafygreen unresonably expects a labelledby here */}
              <Select
                className={selectStyles}
                allowDeselect={false}
                aria-label={'Select accumulator'}
                value={item.accumulator}
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
              <FieldCombobox
                className={accumulatorFieldcomboboxStyles}
                value={item.field}
                onChange={(value: string | null) =>
                  onChangeGroup(index, 'field', value)
                }
                fields={fields}
              />
            </div>
          );
        }}
      />
    </div>
  );
};

export const GroupWithStatistics = ({
  fields,
  serverVersion,
  onChange,
}: GroupOwnProps & MapStateProps) => {
  const [formData, setFormData] = useState<GroupWithStatisticsFormData>({
    groupFields: [],
    groupAccumulators: [
      {
        id: getNextId(),
        field: '',
        accumulator: '',
      },
    ],
  });

  // By default we sort the fields and show numeric fields first
  // as statistics can only be computed on numeric fields.
  const sortedFields = useMemo(() => {
    return [...fields].sort((a, b) => {
      if (NUMERIC_TYPES.includes(a.type) && NUMERIC_TYPES.includes(b.type)) {
        return 0;
      }
      if (NUMERIC_TYPES.includes(a.type) || NUMERIC_TYPES.includes(b.type)) {
        return -1;
      }
      return 1;
    });
  }, [fields]);

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
        fields={sortedFields}
        data={formData.groupAccumulators}
        onChange={(val) => onChangeValue('groupAccumulators', val)}
      />
      <div className={groupRowStyles}>
        <Body className={groupLabelStyles}>grouped by</Body>
        <FieldCombobox
          className={groupFieldscomboboxStyles}
          value={formData.groupFields}
          onChange={(val: string[]) => onChangeValue('groupFields', val)}
          fields={fields}
          multiselect={true}
        />
      </div>
    </div>
  );
};

export default connect(({ serverVersion }: RootState) => ({
  serverVersion,
}))(GroupWithStatistics);
