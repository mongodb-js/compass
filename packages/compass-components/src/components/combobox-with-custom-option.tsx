import React, { useState, useMemo } from 'react';
import { Combobox } from './combobox';
import type {
  ComboboxProps,
  onChangeType,
  SelectValueType,
} from './combobox/Combobox.types';

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

    if (search && !allOptions.map((x) => x.value).includes(search)) {
      _opts.push(
        renderOption({ value: search } as K, allOptions.length + 1, true)
      );
    }
    return _opts;
  }, [userOptions, customOptions, search]);

  return (
    <Combobox
      {...props}
      multiselect={multiselect}
      onFilter={setSearch}
      onChange={(value: string | string[] | null) => {
        if (!onChange) return;
        if (multiselect) {
          const multiSelectValues = value as SelectValueType<true>;
          const customOptions = multiSelectValues
            .filter((value) => !userOptions.map((x) => x.value).includes(value))
            .map((x) => ({ value: x })) as K[];
          setCustomOptions(customOptions);
          (onChange as onChangeType<true>)(multiSelectValues);
        } else {
          const selectValue = value as SelectValueType<false>;
          if (
            selectValue &&
            !userOptions.map((x) => x.value).includes(selectValue)
          ) {
            setCustomOptions([{ value: selectValue } as K]);
          }
          (onChange as onChangeType<false>)(selectValue);
        }
      }}
    >
      {comboboxOptions}
    </Combobox>
  );
};
