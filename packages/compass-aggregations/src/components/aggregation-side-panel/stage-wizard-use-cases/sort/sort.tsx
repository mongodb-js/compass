import {
  Select,
  Option,
  IconButton,
  Icon,
  Body,
  spacing,
  css,
  ComboboxWithCustomOption,
} from '@mongodb-js/compass-components';
import React, { useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../../../modules';

const SORT_DIRECTION_OPTIONS = [
  {
    label: 'Ascending',
    value: 'Asc',
  },
  {
    label: 'Descending',
    value: 'Desc',
  },
] as const;

type SortDirection = typeof SORT_DIRECTION_OPTIONS[number]['value'];
type SortFieldState = {
  field: string;
  direction: SortDirection;
};

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
});

const formGroupStyles = css({
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  gap: spacing[2],
});

const labelStyles = css({
  minWidth: '140px',
  textAlign: 'right',
});

const sortDirectionStyles = css({
  width: '150px',
});

const mapSortFormDataToStageValue = (
  formData: SortFieldState[]
): Record<string, number> => {
  return formData.reduce<Record<string, number>>((acc, sort) => {
    if (sort.field) {
      acc[sort.field] = sort.direction === 'Asc' ? 1 : -1;
    }
    return acc;
  }, {});
};

export const SortForm = ({
  fields,
  onChange,
}: {
  fields: string[];
  onChange: (value: string, error: Error | null) => void;
}) => {
  const [formData, setFormData] = useState<SortFieldState[]>([
    {
      field: '',
      direction: 'Asc',
    },
  ]);

  useEffect(() => {
    const stageValue = mapSortFormDataToStageValue(formData);
    onChange(
      JSON.stringify(stageValue),
      Object.keys(stageValue).length === 0
        ? new Error('No field selected')
        : null
    );
  }, [formData, onChange]);

  const onSelectField = (index: number, value: string | null) => {
    if (!value) return;
    const newFormData = [...formData];
    newFormData[index].field = value;
    setFormData(newFormData);
  };

  const onSelectDirection = (index: number, value: SortDirection) => {
    const newFormData = [...formData];
    newFormData[index].direction = value;
    setFormData(newFormData);
  };

  const addItem = (at: number) => {
    const newData = [...formData];
    newData.splice(at + 1, 0, {
      field: '',
      direction: 'Asc',
    });
    setFormData(newData);
  };

  const removeItem = (at: number) => {
    const newData = [...formData];
    newData.splice(at, 1);
    setFormData(newData);
  };

  const comboboxStyles = useMemo(() => {
    return {
      width: `calc(${String(
        Math.max(...fields.map((label) => label.length), 10)
      )}ch)`,
    };
  }, [fields]);

  return (
    <div className={containerStyles}>
      {formData.map((sort, index: number) => (
        <div
          className={formGroupStyles}
          key={`sort-form-${index}`}
          data-testid={`sort-form-${index}`}
        >
          <Body className={labelStyles}>
            {index === 0 ? 'Sort documents by' : 'and'}
          </Body>
          <div data-testid={`sort-form-${index}-field`}>
            <ComboboxWithCustomOption
              style={comboboxStyles}
              aria-label="Select a field"
              size="default"
              clearable={false}
              value={sort.field}
              onChange={(value: string | null) => onSelectField(index, value)}
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
              usePortal={false}
              value={sort.direction}
              onChange={(value: string) =>
                onSelectDirection(index, value as SortDirection)
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
          <Body>order</Body>
          <IconButton aria-label="Add" onClick={() => addItem(index)}>
            <Icon glyph="Plus" />
          </IconButton>
          {formData.length > 1 && (
            <IconButton aria-label="Remove" onClick={() => removeItem(index)}>
              <Icon glyph="Minus" />
            </IconButton>
          )}
        </div>
      ))}
    </div>
  );
};

export default connect((state: RootState) => ({
  fields: state.fields.map((x: { name: string }) => x.name),
}))(SortForm);
