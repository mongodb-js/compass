import {
  css,
  Body,
  Select,
  Option,
  spacing,
  ListEditor,
  TextInput,
} from '@mongodb-js/compass-components';
import React, { useMemo, useState } from 'react';
import { connect } from 'react-redux';
import type { ACCUMULATORS, Completion } from '@mongodb-js/mongodb-constants';
import { getFilteredCompletions } from '@mongodb-js/mongodb-constants';
import type { Document } from 'mongodb';
import { getNextId, mapFieldsToAccumulatorValue } from '../utils';
import type { RootState } from '../../../../modules';
import type { WizardComponentProps } from '..';
import { FieldCombobox } from '../field-combobox';

type Accumulator = typeof ACCUMULATORS[number];

const ACCUMULATOR_LABELS = {
  $avg: 'Average',
  $min: 'Minimum',
  $stdDevPop: 'Standard Deviation',
  $count: 'Count',
  $max: 'Maximum',
  $sum: 'Sum',
  $first: 'First',
  $last: 'Last',
} as const;

const SUPPORTED_ACCUMULATORS = Object.keys(ACCUMULATOR_LABELS);

type SupportedAccumulator = Extract<
  Accumulator,
  { value: keyof typeof ACCUMULATOR_LABELS }
>;

function isSupportedAccumulator(c: Completion): c is SupportedAccumulator {
  return SUPPORTED_ACCUMULATORS.includes(c.value);
}

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
  minWidth: '135px',
  textAlign: 'left',
});

const LONGEST_ACCUMULATOR_LABEL = Math.max(
  ...Object.values(ACCUMULATOR_LABELS).map((label) => {
    return label.length;
  })
);

const selectStyles = css({
  width: `${String(LONGEST_ACCUMULATOR_LABEL)}ch`,
});
const accumulatorFieldcomboboxStyles = css({ width: '300px' });
const groupFieldscomboboxStyles = css({ width: '100%' });

type GroupOwnProps = WizardComponentProps & {
  defaultAccumulator?: keyof typeof ACCUMULATOR_LABELS;
};

type MapStateProps = { serverVersion: string };

type GroupAccumulators = {
  id: number;
  newField: string;
  accumulatorFields: string;
  accumulator: string;
};

type GroupWithStatisticsFormData = {
  groupFields: string[];
  groupAccumulators: GroupAccumulators[];
};

const _getGroupAccumulatorValue = ({
  accumulatorFields: field,
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
      .filter((x) => x.accumulator && x.accumulatorFields)
      .map((x) => [x.newField, _getGroupAccumulatorValue(x)])
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
    if (value === null || value === undefined) {
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
      newField: '',
      accumulatorFields: '',
      accumulator: '',
    });
    onChange(newData);
  };

  const onRemoveItem = (at: number) => {
    const newData = [...data];
    newData.splice(at, 1);
    onChange(newData);
  };

  const accumulators = useMemo(() => {
    return getFilteredCompletions({
      serverVersion,
      meta: ['accumulator'],
    })
      .filter(isSupportedAccumulator)
      .sort((a, b) => {
        return ACCUMULATOR_LABELS[a.value].localeCompare(
          ACCUMULATOR_LABELS[b.value]
        );
      });
  }, [serverVersion]);

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
              <TextInput
                type="text"
                aria-label="New field name"
                placeholder="New field name"
                value={item.newField}
                onChange={(e) => {
                  onChangeGroup(index, 'newField', e.target.value);
                }}
              />
              as
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
                {accumulators.map((x) => {
                  return (
                    <Option value={x.value} key={x.value}>
                      {ACCUMULATOR_LABELS[x.value]}
                    </Option>
                  );
                })}
              </Select>
              <Body>of</Body>
              <FieldCombobox
                className={accumulatorFieldcomboboxStyles}
                value={item.accumulatorFields}
                onChange={(value: string | null) =>
                  onChangeGroup(index, 'accumulatorFields', value)
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

const addFieldsTitle = css({ marginTop: spacing[2] });
export const GroupWithStatistics = ({
  fields,
  serverVersion,
  onChange,
  defaultAccumulator,
}: GroupOwnProps & MapStateProps) => {
  const [formData, setFormData] = useState<GroupWithStatisticsFormData>({
    groupFields: [],
    groupAccumulators: [
      {
        id: getNextId(),
        newField: '',
        accumulatorFields: '',
        accumulator: defaultAccumulator ?? '',
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
      newData.groupAccumulators.filter(
        (x) => x.accumulator && x.accumulatorFields && x.newField
      ).length === 0;
    onChange(
      mapGroupFormStateToStageValue(newData),
      isValuesEmpty ? new Error('Select one group accumulator') : null
    );
  };

  return (
    <div className={containerStyles}>
      <div className={groupRowStyles}>
        <Body className={groupLabelStyles}>Group documents by</Body>
        <FieldCombobox
          className={groupFieldscomboboxStyles}
          value={formData.groupFields}
          onChange={(val: string[]) => onChangeValue('groupFields', val)}
          fields={fields}
          multiselect={true}
        />
      </div>

      <div className={addFieldsTitle}>Add fields to each group</div>

      <GroupAccumulatorForm
        serverVersion={serverVersion}
        fields={fields}
        data={formData.groupAccumulators}
        onChange={(val) => onChangeValue('groupAccumulators', val)}
      />
    </div>
  );
};

export default connect(({ serverVersion }: RootState) => ({
  serverVersion,
}))(GroupWithStatistics);
