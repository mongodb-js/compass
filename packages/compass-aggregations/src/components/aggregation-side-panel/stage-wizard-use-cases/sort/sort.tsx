import {
  Select,
  Option,
  Body,
  spacing,
  css,
  ListEditor,
} from '@mongodb-js/compass-components';
import React, { useMemo, useState } from 'react';
import {
  SORT_DIRECTION_OPTIONS,
  getNextId,
  mapSortDataToStageValue,
} from '../utils';

import type { WizardComponentProps } from '..';
import { FieldCombobox } from '../field-combobox';

type SortDirection = typeof SORT_DIRECTION_OPTIONS[number]['value'];
type SortFieldState = {
  id: number;
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
  fields: WizardComponentProps['fields'];
  sortField: string;
  sortDirection: SortDirection;
  onChange: <T extends keyof SortFieldState>(
    property: T,
    value: SortFieldState[T]
  ) => void;
}) => {
  return (
    <div className={formGroupStyles}>
      <Body className={labelStyles}>
        {index === 0 ? 'Sort documents by' : 'and'}
      </Body>
      <div data-testid={`sort-form-${index}-field`}>
        <FieldCombobox
          className={comboboxClassName}
          value={sortField}
          onChange={(value: string | null) => {
            if (value) {
              onChange('field', value);
            }
          }}
          fields={fields}
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
  const [formData, setFormData] = useState<SortFieldState[]>([
    {
      id: getNextId(),
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
      id: getNextId(),
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
        Math.max(...fields.map(({ name }) => name.length), 10)
      )}ch)`,
    });
  }, [fields]);

  return (
    <div className={containerStyles}>
      <ListEditor
        items={formData}
        onAddItem={(index) => onAddItem(index)}
        onRemoveItem={(index) => onRemoveItem(index)}
        itemTestId={(index) => `sort-form-${index}`}
        itemKey={(item) => String(item.id)}
        renderItem={(item, index) => {
          return (
            <SortFormGroup
              comboboxClassName={comboboxClassName}
              index={index}
              sortField={item.field}
              sortDirection={item.direction}
              fields={fields}
              onChange={(prop, value) => onChangeProperty(index, prop, value)}
            />
          );
        }}
      />
    </div>
  );
};

export default SortForm;
