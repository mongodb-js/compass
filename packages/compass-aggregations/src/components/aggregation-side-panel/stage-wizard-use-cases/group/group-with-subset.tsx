import {
  css,
  Body,
  Select,
  Option,
  spacing,
  TextInput,
} from '@mongodb-js/compass-components';
import React, { useMemo, useState } from 'react';
import { connect } from 'react-redux';
import type { ACCUMULATORS, Completion } from '@mongodb-js/mongodb-constants';
import { getFilteredCompletions } from '@mongodb-js/mongodb-constants';
import type { Document } from 'mongodb';
import {
  SORT_DIRECTION_OPTIONS,
  mapFieldsToAccumulatorValue,
  mapSortDataToStageValue,
} from '../utils';
import type { SortDirection } from '../utils';
import type { RootState } from '../../../../modules';
import type { WizardComponentProps } from '..';
import { FieldCombobox } from '../field-combobox';

type Accumulator = typeof ACCUMULATORS[number];

const SUBSET_ACCUMULATORS = {
  $first: {
    label: 'First',
    needsSortFields: false,
    nOperator: '$firstN',
    order: 1,
  },
  $last: {
    label: 'Last',
    needsSortFields: false,
    nOperator: '$lastN',
    order: 2,
  },
  $top: {
    label: 'Top',
    needsSortFields: true,
    nOperator: '$topN',
    order: 3,
  },
  $bottom: {
    label: 'Bottom',
    needsSortFields: true,
    nOperator: '$bottomN',
    order: 4,
  },
} as const;

const N_OPERATORS = Object.values(SUBSET_ACCUMULATORS).map(
  (acc) => acc.nOperator
);

function isGroupNOperator(k: string): k is typeof N_OPERATORS[number] {
  return N_OPERATORS.includes(k as any);
}

const SUPPORTED_ACCUMULATORS = Object.keys(SUBSET_ACCUMULATORS);

type SupportedAccumulator = Extract<
  Accumulator,
  { value: keyof typeof SUBSET_ACCUMULATORS }
>;

function isSupportedAccumulator(c: Completion): c is SupportedAccumulator {
  return SUPPORTED_ACCUMULATORS.includes(c.value);
}

function isSupportedAccumulatorKey(
  k: string
): k is keyof typeof SUBSET_ACCUMULATORS {
  return SUPPORTED_ACCUMULATORS.includes(k);
}

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
  accumulator: keyof typeof SUBSET_ACCUMULATORS | null;
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

  if (!accumulator) {
    return {};
  }

  const accumulatorMeta = SUBSET_ACCUMULATORS[accumulator];

  const sortBy = mapSortDataToStageValue(
    sortFields.map((x) => ({
      field: x,
      direction: sortDirection,
    }))
  );

  const keyName = accumulatorMeta.needsSortFields ? 'output' : 'input';

  if (numberOfRecords > 1) {
    return {
      _id: mapFieldsToAccumulatorValue(data.groupFields),
      data: {
        [accumulatorMeta.nOperator]: {
          n: numberOfRecords,
          [keyName]: mapFieldsToAccumulatorValue(projectFields),
          ...(accumulatorMeta.needsSortFields ? { sortBy } : {}),
        },
      },
    };
  }

  if (accumulatorMeta.needsSortFields) {
    return {
      _id: mapFieldsToAccumulatorValue(data.groupFields),
      data: {
        [accumulator]: {
          [keyName]: mapFieldsToAccumulatorValue(projectFields),
          sortBy,
        },
      },
    };
  }

  return {
    _id: mapFieldsToAccumulatorValue(groupFields),
    data: {
      [accumulator]: mapFieldsToAccumulatorValue(projectFields),
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
  const sortFieldsRequired = data.accumulator
    ? SUBSET_ACCUMULATORS[data.accumulator].needsSortFields
    : false;

  if (sortFieldsRequired && data.sortFields.length === 0) {
    return new Error('Sort fields are required.');
  }

  return null;
};

export const GroupWithSubset = ({
  fields,
  serverVersion,
  onChange,
}: WizardComponentProps & { serverVersion: string }) => {
  const [formData, setFormData] = useState<GroupWithSubsetFormData>({
    groupFields: [],
    projectFields: [],
    accumulator: null,
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

  const accumulators = useMemo(() => {
    return getFilteredCompletions({
      serverVersion,
      meta: ['accumulator', 'accumulator:*'],
    })
      .filter(isSupportedAccumulator)
      .sort((a, b) => {
        return (
          SUBSET_ACCUMULATORS[a.value].order -
          SUBSET_ACCUMULATORS[b.value].order
        );
      });
  }, [serverVersion]);

  // If any of the n accumulator is supported, we show the input field
  // to enter the n value.
  const isCountFieldVisible = useMemo(() => {
    return getFilteredCompletions({
      serverVersion,
      meta: ['accumulator'],
    }).some((c) => {
      return isGroupNOperator(c.value);
    });
  }, [serverVersion]);

  const selectedAccumulatorMeta = formData.accumulator
    ? SUBSET_ACCUMULATORS[formData.accumulator]
    : null;

  return (
    <div className={containerStyles}>
      <div className={formGroupStyles}>
        <Body className={groupLabelStyles}>Return the</Body>
        {/* @ts-expect-error leafygreen unresonably expects a labelledby here */}
        <Select
          className={selectStyles}
          allowDeselect={false}
          aria-label={'Select accumulator'}
          value={formData.accumulator ?? ''}
          onChange={(value) => {
            onChangeValue(
              'accumulator',
              isSupportedAccumulatorKey(value) ? value : null
            );
          }}
        >
          {accumulators.map((x) => {
            return (
              <Option value={x.value} key={x.value}>
                {SUBSET_ACCUMULATORS[x.value].label}
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
        <FieldCombobox
          className={groupFieldscomboboxStyles}
          aria-label={'Select project field names'}
          placeholder={'Select project field names'}
          multiselect={true}
          value={formData.projectFields}
          onChange={(val: string[]) => onChangeValue('projectFields', val)}
          fields={fields}
        />
      </div>
      <div className={formGroupStyles}>
        <Body className={groupLabelStyles}>from a group of</Body>
        <FieldCombobox
          className={groupFieldscomboboxStyles}
          aria-label={'Select group field names'}
          placeholder={'Select group field names'}
          multiselect={true}
          value={formData.groupFields}
          onChange={(val: string[]) => onChangeValue('groupFields', val)}
          fields={fields}
        />
      </div>
      {selectedAccumulatorMeta?.needsSortFields && (
        <div className={formGroupStyles}>
          <Body className={groupLabelStyles}>
            documents from a list sorted by
          </Body>
          <FieldCombobox
            className={groupFieldscomboboxStyles}
            aria-label={'Select sort field names'}
            placeholder={'Select sort field names'}
            multiselect={true}
            value={formData.sortFields}
            onChange={(val: string[]) => onChangeValue('sortFields', val)}
            fields={fields}
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
