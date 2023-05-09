import {
  Select,
  Option,
  Body,
  spacing,
  css,
  ComboboxWithCustomOption,
  ListEditor,
} from '@mongodb-js/compass-components';
import React, { useMemo, useState } from 'react';
import { SORT_DIRECTION_OPTIONS, mapSortDataToStageValue } from '../utils';

import type { WizardComponentProps } from '..';

type SortDirection = typeof SORT_DIRECTION_OPTIONS[number]['value'];
type SortFieldState = {
  field: string;
  direction: SortDirection;
};

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
  width: 'max-content',
  maxWidth: '100%',
});

const formGroupStyles = css({
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  gap: spacing[2],
});

const labelStyles = css({
  minWidth: `${'Sort documents by'.length}ch`,
  textAlign: 'right',
});

const sortDirectionStyles = css({
  width: '150px',
});

const mapSortFormDataToStageValue = (
  formData: SortFieldState[]
): Record<string, number> => {
  return mapSortDataToStageValue(formData);
};

const SortFormGroup = ({
  index,
  comboboxClassName,
  fields,
  sortField,
  sortDirection,
  onChange,
}: {
  index: number;
  comboboxClassName: string;
  fields: string[];
  sortField: string;
  sortDirection: SortDirection;
  onChange: <T extends keyof SortFieldState>(
    property: T,
    value: SortFieldState[T]
  ) => void;
}) => {
  return (
    <div className={formGroupStyles} key={`sort-form-${index}`}>
      <Body className={labelStyles}>
        {index === 0 ? 'Sort documents by' : 'and'}
      </Body>
      <div data-testid={`sort-form-${index}-field`}>
        <ComboboxWithCustomOption
          className={comboboxClassName}
          aria-label="Select a field"
          size="default"
          clearable={false}
          value={sortField}
          onChange={(value: string | null) => {
            if (value) {
              onChange('field', value);
            }
          }}
          options={fields}
          optionLabel="Field:"
          // Used for testing to access the popover for a stage
          popoverClassName={`sort-form-${index}-field-combobox`}
        />
      </div>
      <Body>in</Body>
      <div data-testid={`sort-form-${index}-direction`}>
        {/* @ts-expect-error leafygreen unresonably expects a labelledby here */}
        <Select
          className={sortDirectionStyles}
          allowDeselect={false}
          aria-label="Select direction"
          value={sortDirection}
          onChange={(value: string) =>
            onChange('direction', value as SortDirection)
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
      </div>
    </div>
  );
};

export const SortForm = ({ fields, onChange }: WizardComponentProps) => {
  const fieldNames = useMemo(() => fields.map(({ name }) => name), [fields]);
  const [formData, setFormData] = useState<SortFieldState[]>([
    {
      field: '',
      direction: 'Asc',
    },
  ]);

  const onSetFormData = (data: SortFieldState[]) => {
    const stageValue = mapSortFormDataToStageValue(data);
    onChange(
      JSON.stringify(stageValue),
      Object.keys(stageValue).length === 0
        ? new Error('No field selected')
        : null
    );

    setFormData(data);
  };

  const onChangeProperty = <T extends keyof SortFieldState>(
    index: number,
    property: T,
    value: SortFieldState[T]
  ) => {
    const newFormData = [...formData];
    newFormData[index][property] = value;
    onSetFormData(newFormData);
  };

  const onAddItem = (at: number) => {
    const newData = [...formData];
    newData.splice(at + 1, 0, {
      field: '',
      direction: 'Asc',
    });
    onSetFormData(newData);
  };

  const onRemoveItem = (at: number) => {
    const newData = [...formData];
    newData.splice(at, 1);
    onSetFormData(newData);
  };

  const comboboxClassName = useMemo(() => {
    return css({
      width: `calc(${String(
        Math.max(...fieldNames.map((label) => label.length), 10)
      )}ch)`,
    });
  }, [fieldNames]);

  return (
    <div className={containerStyles}>
      <ListEditor
        items={formData}
        onAddItem={(index) => onAddItem(index)}
        onRemoveItem={(index) => onRemoveItem(index)}
        itemTestId={(index) => `sort-form-${index}`}
        renderItem={(item, index) => {
          return (
            <SortFormGroup
              comboboxClassName={comboboxClassName}
              index={index}
              sortField={item.field}
              sortDirection={item.direction}
              fields={fieldNames}
              onChange={(prop, value) => onChangeProperty(index, prop, value)}
            />
          );
        }}
      />
    </div>
  );
};

export default SortForm;
