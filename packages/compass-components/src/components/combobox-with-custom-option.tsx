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
};

export const ComboboxWithCustomOption = <M extends boolean>({
  onChange,
  options,
  optionLabel,
  multiselect = false as M,
  ...props
}: ComboboxWithCustomOptionProps<M>) => {
  const [search, setSearch] = useState('');
  const comboboxOptions = useMemo(() => {
    const _opts = options.map((option, index) => (
      <ComboboxOption
        key={`combobox-option-${index}`}
        value={option}
        displayName={option}
      />
    ));
    if (search && !options.includes(search)) {
      _opts.push(
        <ComboboxOption
          key={`combobox-option-new`}
          value={search}
          displayName={optionLabel ? `${optionLabel} "${search}"` : search}
        />
      );
    }
    return _opts;
  }, [options, search, optionLabel]);
  return (
    <Combobox
      {...props}
      multiselect={multiselect}
      onFilter={setSearch}
      onChange={(value: string | string[] | null) => {
        if (!onChange) return;
        if (multiselect) {
          (onChange as onChangeType<true>)(value as SelectValueType<true>);
        } else {
          (onChange as onChangeType<false>)(value as SelectValueType<false>);
        }
      }}
    >
      {comboboxOptions}
    </Combobox>
  );
};
