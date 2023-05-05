import {
  css,
  Body,
  Select,
  Option,
  spacing,
  TextInput,
  ComboboxWithCustomOption,
} from '@mongodb-js/compass-components';
import React, { useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { ACCUMULATORS as MDB_ACCUMULATORS } from '@mongodb-js/mongodb-constants';
import type { Document } from 'mongodb';
import semver from 'semver';
import {
  SORT_DIRECTION_OPTIONS,
  mapFieldsToAccumulatorValue,
  mapSortDataToStageValue,
} from '../utils';
import type { SortDirection } from '../utils';
import type { RootState } from '../../../../modules';

type AccumulatorName = typeof MDB_ACCUMULATORS[number]['value'];
type GroupAccumulator = {
  label: string;
  value: AccumulatorName;
  version: string;
};
type SubsetAccumulator = GroupAccumulator & {
  needsSortFields: boolean;
  nOperator: GroupAccumulator;
};

const MDB_ACCUMULATORS_VERSION = Object.fromEntries(
  MDB_ACCUMULATORS.map((x) => [x.value, x.version])
) as Record<AccumulatorName, string>;

const SUBSET_ACCUMULATORS = [
  {
    label: 'First',
    value: '$first',
    needsSortFields: false,
    nOperator: {
      label: 'FirstN',
      value: '$firstN',
    },
  },
  {
    label: 'Last',
    value: '$last',
    needsSortFields: false,
    nOperator: {
      label: 'LastN',
      value: '$lastN',
    },
  },
  {
    label: 'Top',
    value: '$top',
    needsSortFields: true,
    nOperator: {
      label: 'TopN',
      value: '$topN',
    },
  },
  {
    label: 'Bottom',
    value: '$bottom',
    needsSortFields: true,
    nOperator: {
      label: 'BottomN',
      value: '$bottomN',
    },
  },
] as const;

const ACCUMULATORS: SubsetAccumulator[] = SUBSET_ACCUMULATORS.map((acc) => {
  return {
    ...acc,
    version: MDB_ACCUMULATORS_VERSION[acc.value],
    nOperator: {
      ...acc.nOperator,
      version: MDB_ACCUMULATORS_VERSION[acc.nOperator.value],
    },
  };
});

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
});

const formGroupStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing[2],
});

const groupLabelStyles = css({
  minWidth: '120px',
  width: '120px',
  textAlign: 'right',
});

const selectStyles = css({
  width: '150px',
});

const recordInputStyles = css({
  width: '100px',
});

const groupFieldscomboboxStyles = css({ width: '300px' });

// Exported for tests
export type GroupWithSubsetFormData = {
  groupFields: string[];
  projectFields: string[];
  accumulator: string;
  numberOfRecords: number;
  sortFields: string[];
  sortDirection: SortDirection;
};

// Exported for tests
export const mapGroupFormStateToStageValue = (
  data: GroupWithSubsetFormData
): Document => {
  const {
    accumulator,
    groupFields,
    projectFields,
    numberOfRecords,
    sortFields,
    sortDirection,
  } = data;

  const mainAccumulator = ACCUMULATORS.find((x) => x.value === accumulator);

  if (!mainAccumulator) {
    return {};
  }

  const sortBy = mapSortDataToStageValue(
    sortFields.map((x) => ({
      field: x,
      direction: sortDirection,
    }))
  );

  const keyName = mainAccumulator.needsSortFields ? 'output' : 'input';

  if (numberOfRecords > 1) {
    return {
      _id: mapFieldsToAccumulatorValue(data.groupFields),
      data: {
        [mainAccumulator.nOperator.value]: {
          n: numberOfRecords,
          [keyName]: mapFieldsToAccumulatorValue(projectFields),
          ...(mainAccumulator.needsSortFields
            ? {
                sortBy,
              }
            : {}),
        },
      },
    };
  }

  if (mainAccumulator.needsSortFields) {
    return {
      _id: mapFieldsToAccumulatorValue(data.groupFields),
      data: {
        [mainAccumulator.value]: {
          [keyName]: mapFieldsToAccumulatorValue(projectFields),
          sortBy,
        },
      },
    };
  }

  return {
    _id: mapFieldsToAccumulatorValue(groupFields),
    data: {
      [mainAccumulator.value]: mapFieldsToAccumulatorValue(projectFields),
    },
  };
};

// Exported for tests
export const getValidationError = (data: GroupWithSubsetFormData) => {
  if (!data.accumulator) {
    return new Error('Accumulator is required.');
  }
  if (data.numberOfRecords < 1) {
    return new Error('Number of records is not valid.');
  }
  if (data.projectFields.length === 0) {
    return new Error('Accumulator fields are required.');
  }
  const sortFieldsRequired = ACCUMULATORS.find(
    (x) => x.value === data.accumulator && x.needsSortFields
  );

  if (sortFieldsRequired && data.sortFields.length === 0) {
    return new Error('Sort fields are required.');
  }

  return null;
};

export const GroupWithSubset = ({
  fields,
  serverVersion,
  onChange,
}: {
  fields: string[];
  serverVersion: string;
  onChange: (value: string, error: Error | null) => void;
}) => {
  const [formData, setFormData] = useState<GroupWithSubsetFormData>({
    groupFields: [],
    projectFields: [],
    accumulator: '',
    numberOfRecords: 1,
    sortFields: [],
    sortDirection: 'Asc',
  });

  const onChangeValue = <T extends keyof GroupWithSubsetFormData>(
    key: T,
    value: GroupWithSubsetFormData[T]
  ) => {
    const newData = {
      ...formData,
      [key]: value,
    };
    setFormData(newData);
    onChange(
      JSON.stringify(mapGroupFormStateToStageValue(newData)),
      getValidationError(newData)
    );
  };

  const serverAwareAccumulators = useMemo(
    () => ACCUMULATORS.filter((x) => semver.gte(serverVersion, x.version)),
    [serverVersion]
  );

  // If any of the n accumulator is supported, we show the input field
  // to enter the n value.
  const isCountFieldVisible = useMemo(
    () =>
      ACCUMULATORS.filter((x) => semver.gte(serverVersion, x.nOperator.version))
        .length > 0,
    [serverVersion]
  );

  const isSortFieldVisible = useMemo(
    () =>
      ACCUMULATORS.find(
        (x) => x.value === formData.accumulator && x.needsSortFields
      ),
    [formData.accumulator]
  );

  return (
    <div className={containerStyles}>
      <div className={formGroupStyles}>
        <Body className={groupLabelStyles}>Return the</Body>
        {/* @ts-expect-error leafygreen unresonably expects a labelledby here */}
        <Select
          className={selectStyles}
          allowDeselect={false}
          aria-label={'Select accumulator'}
          value={formData.accumulator}
          onChange={(value: string) => onChangeValue('accumulator', value)}
        >
          {serverAwareAccumulators.map((x, i) => {
            return (
              <Option value={x.value} key={i}>
                {x.label}
              </Option>
            );
          })}
        </Select>
        {isCountFieldVisible && (
          <>
            <TextInput
              type="number"
              aria-label="Number of records"
              placeholder="Number of records"
              className={recordInputStyles}
              value={formData.numberOfRecords.toString()}
              min={1}
              onChange={(e) =>
                onChangeValue('numberOfRecords', Number(e.target.value))
              }
            />
            <Body>of</Body>
          </>
        )}
        <ComboboxWithCustomOption<true>
          className={groupFieldscomboboxStyles}
          aria-label={'Select project field names'}
          placeholder={'Select project field names'}
          size="default"
          clearable={true}
          multiselect={true}
          value={formData.projectFields}
          onChange={(val: string[]) => onChangeValue('projectFields', val)}
          options={fields}
          optionLabel="Field:"
          overflow="scroll-x"
        />
      </div>
      <div className={formGroupStyles}>
        <Body className={groupLabelStyles}>from a group of</Body>
        <ComboboxWithCustomOption<true>
          className={groupFieldscomboboxStyles}
          aria-label={'Select group field names'}
          placeholder={'Select group field names'}
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
      {isSortFieldVisible && (
        <div className={formGroupStyles}>
          <Body className={groupLabelStyles}>
            documents from a list sorted by
          </Body>
          <ComboboxWithCustomOption<true>
            className={groupFieldscomboboxStyles}
            aria-label="Select sort field names"
            size="default"
            clearable={false}
            multiselect={true}
            value={formData.sortFields}
            onChange={(val: string[]) => onChangeValue('sortFields', val)}
            options={fields}
            optionLabel="Field:"
            overflow="scroll-x"
          />
          <Body>in</Body>
          {/* @ts-expect-error leafygreen unresonably expects a labelledby here */}
          <Select
            className={selectStyles}
            allowDeselect={false}
            aria-label="Select direction"
            usePortal={false}
            value={formData.sortDirection}
            onChange={(value: string) =>
              onChangeValue('sortDirection', value as SortDirection)
            }
          >
            {SORT_DIRECTION_OPTIONS.map((sort, index) => {
              return (
                <Option key={index} value={sort.value}>
                  {sort.label}
                </Option>
              );
            })}
          </Select>
          <Body>order</Body>
        </div>
      )}
    </div>
  );
};

export default connect(({ serverVersion }: RootState) => ({
  serverVersion,
}))(GroupWithSubset);
