import {
  ComboboxWithCustomOption,
  ComboboxOption,
} from '@mongodb-js/compass-components';
import React, { useMemo } from 'react';
import type { ComponentProps } from 'react';
import type { WizardComponentProps } from '.';

type CustomComboboxProps = ComponentProps<typeof ComboboxWithCustomOption>;

export const FieldCombobox = ({
  fields,
  multiselect,
  ...props
}: Partial<CustomComboboxProps> & {
  fields: WizardComponentProps['fields'];
}) => {
  const fieldNames = useMemo(
    () => fields.map(({ name, type }) => ({ value: name, type })),
    [fields]
  );
  // todo: className prop
  const comboboxStyles = useMemo(() => {
    return {
      width: `calc(${String(
        Math.max(...fieldNames.map(({ value }) => value.length), 10)
      )}ch)`,
    };
  }, [fieldNames]);

  const label = useMemo(
    () => (multiselect ? 'Select fields' : 'Select a field'),
    [multiselect]
  );

  return (
    <ComboboxWithCustomOption
      aria-label={label}
      placeholder={label}
      multiselect={multiselect}
      style={comboboxStyles}
      size="default"
      clearable={false}
      {...props}
      options={fieldNames}
      renderOption={(option, index, isCustom) => {
        return (
          <ComboboxOption
            key={`field-option-${index}`}
            value={option.value}
            displayName={isCustom ? `Field: "${option.value}"` : option.value}
          />
        );
      }}
    />
  );
};
