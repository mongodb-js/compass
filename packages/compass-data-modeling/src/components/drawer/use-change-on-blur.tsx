import { useState, useLayoutEffect } from 'react';

export function useChangeOnBlur(
  value: string,
  onChange: (newVal: string) => void
): {
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onBlur: React.FocusEventHandler;
  onKeyDown: React.KeyboardEventHandler;
} {
  const [_value, setValue] = useState(value);
  useLayoutEffect(() => {
    // Usually this is in sync with local value, but if it's changed externally,
    // we run an effect and sync it back
    setValue(value);
  }, [value]);
  return {
    value: _value,
    onChange: (evt) => {
      setValue(evt.currentTarget.value);
    },
    onBlur: () => {
      onChange(_value);
    },
    onKeyDown: (evt) => {
      if (evt.key === 'Enter' && !evt.shiftKey) {
        (evt.target as HTMLInputElement | HTMLTextAreaElement).blur?.();
      }
    },
  };
}
