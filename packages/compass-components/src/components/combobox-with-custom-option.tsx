import React, { useState, useMemo } from 'react';
import { Combobox, ComboboxOption } from './combobox';
import type {
  ComboboxProps,
  onChangeType,
  SelectValueType,
} from './combobox/Combobox.types';

type ComboboxWithCustomOptionProps<T extends boolean> = ComboboxProps<T> & {
  options: string[];
  optionLabel?: string;
  isOptionDisabled?: (option: string) => boolean;
};

export const ComboboxWithCustomOption = <M extends boolean>({
  onChange,
  options,
  optionLabel,
  multiselect = false as M,
  isOptionDisabled,
  ...props
}: ComboboxWithCustomOptionProps<M>) => {
  const [customOptions, setCustomOptions] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const comboboxOptions = useMemo(() => {
    const totalOptions = [...options, ...customOptions];
    const _opts = totalOptions.map((option, index) => (
      <ComboboxOption
        disabled={isOptionDisabled ? isOptionDisabled(option) : false}
        key={`combobox-option-${index}`}
        value={option}
        displayName={option}
      />
    ));

    if (search && !totalOptions.includes(search)) {
      _opts.push(
        <ComboboxOption
          disabled={isOptionDisabled ? isOptionDisabled(search) : false}
          key={`combobox-option-new`}
          value={search}
          displayName={optionLabel ? `${optionLabel} "${search}"` : search}
        />
      );
    }
    return _opts;
  }, [options, customOptions, search, optionLabel, isOptionDisabled]);

  return (
    <Combobox
      {...props}
      multiselect={multiselect}
      onFilter={setSearch}
      onChange={(value: string | string[] | null) => {
        if (!onChange) return;
        if (multiselect) {
          const multiSelectValues = value as SelectValueType<true>;
          const customOptions = multiSelectValues.filter(
            (value) => !options.includes(value)
          );
          setCustomOptions(customOptions);
          (onChange as onChangeType<true>)(multiSelectValues);
        } else {
          const selectValue = value as SelectValueType<false>;
          if (selectValue && !options.includes(selectValue)) {
            setCustomOptions([selectValue]);
          }
          (onChange as onChangeType<false>)(selectValue);
        }
      }}
    >
      {comboboxOptions}
    </Combobox>
  );
};
