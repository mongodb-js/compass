import {
  Body,
  spacing,
  css,
  Select,
  Option,
  ComboboxWithCustomOption,
  IconButton,
  Icon,
} from '@mongodb-js/compass-components';
import React, { useEffect, useState } from 'react';
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

const selectStyles = css({ minWidth: '120px' });
const comboboxStyles = css({ width: '300px' });

type GroupValue = {
  field: string;
  accumulator: string;
};

type GroupWithStatisticsFormData = {
  groupFields: string[];
  groupValues: GroupValue[];
};

const _sanitizeFieldName = (name: string): string => {
  return name.replace(/\./g, '_');
};

const _mapFieldsToId = (fields: string[]) => {
  if (fields.length === 0) {
    return null;
  }

  if (fields.length === 1) {
    return `$${fields[0]}`;
  }

  return Object.fromEntries(
    fields.map((x) => [_sanitizeFieldName(x), `$${x}`])
  );
};

const _getGroupKey = ({ field, accumulator }: GroupValue) => {
  if (field === '_id') {
    return `${accumulator}_id`;
  }
  return _sanitizeFieldName(field);
};

const _getGroupValue = ({ field, accumulator }: GroupValue) => {
  return {
    [`$${accumulator}`]: accumulator === 'count' ? {} : `$${field}`,
  };
};

const mapGroupFormStateToStageValue = (
  data: GroupWithStatisticsFormData
): Document => {
  const values = Object.fromEntries(
    data.groupValues
      .filter((x) => x.accumulator && x.field)
      .map((x) => [[_getGroupKey(x)], _getGroupValue(x)])
  );

  return {
    _id: _mapFieldsToId(data.groupFields),
    ...values,
  };
};

const GroupValues = ({
  onChange,
  data,
  fields,
}: {
  onChange: (value: GroupValue[]) => void;
  data: GroupValue[];
  fields: string[];
}) => {
  const onChangeGroup = (
    index: number,
    key: keyof GroupValue,
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
    groupValues: [
      {
        field: '',
        accumulator: '',
      },
    ],
  });

  useEffect(() => {
    const isValuesEmpty =
      formData.groupValues.filter((x) => x.accumulator && x.field).length === 0;
    onChange(
      JSON.stringify(mapGroupFormStateToStageValue(formData)),
      isValuesEmpty ? new Error('Select group items') : null
    );
  }, [formData]);

  const onChangeGroupValues = (groupValues: GroupValue[]) => {
    setFormData({
      ...formData,
      groupValues,
    });
  };

  const onChangeGroupFields = (groupFields: string[]) => {
    setFormData({
      ...formData,
      groupFields,
    });
  };

  return (
    <div className={containerStyles}>
      <GroupValues
        fields={fields}
        data={formData.groupValues}
        onChange={(values) => onChangeGroupValues(values)}
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
          onChange={(val: string[]) => onChangeGroupFields(val)}
          options={fields}
          optionLabel="Field:"
          overflow="scroll-x"
        />
      </div>
    </div>
  );
};

export default GroupWithStatistics;
