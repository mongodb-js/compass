import {
  ComboboxWithCustomOption,
  ComboboxOption,
} from '@mongodb-js/compass-components';
import React, { useMemo } from 'react';
import type { ComponentProps } from 'react';
import type { WizardComponentProps } from '.';

type CustomComboboxProps = ComponentProps<typeof ComboboxWithCustomOption>;

// Generates parent paths for a list of paths
// by joining paths one at a time.
// ['a','b','c'] => ['a', 'a.b', 'a.b.c']
export const getParentPaths = (paths: string[], excluding: string[] = []) => {
  const parentPaths = paths.reduce<string[]>((parents, path) => {
    const parentPath = !parents.length
      ? path
      : parents[parents.length - 1] + '.' + path;

    return [...parents, parentPath];
  }, []);

  return parentPaths.filter((path) => !excluding.includes(path));
};

export const isOptionDisabled = (selectedOptions: string[], option: string) => {
  const paths = option.split('.');
  // If option is nested property then we might need to disable
  // it if one of its possible children or one of its parent is
  //  already in projection
  if (paths.length > 1) {
    const parentPaths = getParentPaths(paths, [option]);
    const parentPathInProjection = parentPaths.some((path) =>
      selectedOptions.includes(path)
    );
    const childrenInProjection = selectedOptions.some((field) =>
      field.startsWith(`${option}.`)
    );
    return parentPathInProjection || childrenInProjection;
  }

  // If option is a path at first level then we disable it only
  // when any of its children are already in projection
  return selectedOptions.some((field) => field.startsWith(`${option}.`));
};

export const FieldCombobox = ({
  fields: schemaFields,
  multiselect,
  'aria-label': ariaLabel,
  placeholder,
  isRelatedFieldDisabled = false,
  value,
  ...props
}: Partial<CustomComboboxProps> & {
  fields: WizardComponentProps['fields'];
  // When selecting a field, if its nested or parent field should be disabled.
  // Only applicable when its a multiselect combobox.
  isRelatedFieldDisabled?: boolean;
}) => {
  const fields = useMemo(
    () => schemaFields.map(({ name, type }) => ({ value: name, type })),
    [schemaFields]
  );

  const label = useMemo(
    () => (multiselect ? 'Select fields' : 'Select a field'),
    [multiselect]
  );

  return (
    <ComboboxWithCustomOption
      aria-label={ariaLabel ?? label}
      placeholder={placeholder ?? label}
      multiselect={multiselect}
      size="default"
      clearable={false}
      {...props}
      options={fields}
      value={value}
      renderOption={(option, index, isCustom) => {
        return (
          <ComboboxOption
            key={`field-option-${index}`}
            value={option.value}
            displayName={isCustom ? `Field: "${option.value}"` : option.value}
            disabled={
              isRelatedFieldDisabled && multiselect
                ? isOptionDisabled(value as string[], option.value)
                : false
            }
          />
        );
      }}
    />
  );
};
