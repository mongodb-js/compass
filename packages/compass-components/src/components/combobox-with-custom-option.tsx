import React, { useState, useMemo } from 'react';
import { Combobox } from './leafygreen';
import type { ComboboxProps } from '@leafygreen-ui/combobox';

type SelectValueType<T extends boolean> = Required<ComboboxProps<T>>['value'];
type OnChangeType<T extends boolean> = Required<ComboboxProps<T>>['onChange'];
type ComboboxWithCustomOptionProps<T extends boolean, K> = ComboboxProps<T> & {
  options: K[];
  renderOption: (option: K, index: number, isCustom: boolean) => JSX.Element;
};

export const ComboboxWithCustomOption = <
  M extends boolean,
  K extends { value: string }
>({
  onChange,
  options: userOptions,
  multiselect = false as M,
  renderOption,
  ...props
}: ComboboxWithCustomOptionProps<M, K>) => {
  const [customOptions, setCustomOptions] = useState<K[]>([]);
  const [search, setSearch] = useState('');

  const comboboxOptions = useMemo(() => {
    const allOptions = [...userOptions, ...customOptions];
    const _opts = allOptions.map((option, index) =>
      renderOption(option, index, false)
    );

    if (search && !allOptions.find((x) => x.value.includes(search))) {
      _opts.push(
        renderOption({ value: search } as K, allOptions.length + 1, true)
      );
    }
    return _opts;
  }, [userOptions, customOptions, search, renderOption]);

  const selectValueAndRunOnChange = (value: string[] | string | null) => {
    if (!onChange || !value) return;

    if (multiselect) {
      const multiSelectValues = value as SelectValueType<true>;
      const customOptions = multiSelectValues
        .filter((value) => !userOptions.find((x) => x.value === value))
        .map((x) => ({ value: x })) as K[];
      setCustomOptions(customOptions);
      (onChange as OnChangeType<true>)(multiSelectValues);
    } else {
      const selectValue = value as SelectValueType<false>;
      if (selectValue && !userOptions.find((x) => x.value === selectValue)) {
        setCustomOptions([{ value: selectValue } as K]);
      }
      (onChange as OnChangeType<false>)(selectValue);
    }
  };

  return (
    <Combobox
      {...props}
      multiselect={multiselect}
      onFilter={setSearch}
      onBlur={(evt) => {
        // Set a search value as the combobox value onBlur event to fix missing values on modal submit COMPASS-6511
        // We don't do this for multiselect, because in this case, you should explicitly check the value in the list.
        if (!multiselect) {
          selectValueAndRunOnChange((evt.target as any).value);
        }
      }}
      onChange={selectValueAndRunOnChange}
    >
      {comboboxOptions}
    </Combobox>
  );
};
