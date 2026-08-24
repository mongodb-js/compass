import React from 'react';
import { cx } from '@leafygreen-ui/emotion';
import {
  editorInvalidStyles,
  editorInvalidLightModeStyles,
  editorInvalidDarkModeStyles,
  editorStyles,
} from './shared';
import type { EditorProps } from './shared';
import { useDarkMode } from '../../../hooks/use-theme';

// Base single-line editor shared by the default, date and UUID editors. Callers
// only need to provide the value handling and their own width / placeholder.
export function InputEditor({
  value,
  valid,
  onChange,
  autoFocus,
  onBlur,
  className,
  ...props
}: Omit<EditorProps, 'type'>) {
  const darkMode = useDarkMode();

  return (
    <input
      {...props}
      type="text"
      data-testid="hadron-document-value-editor"
      value={value}
      onChange={(evt) => {
        onChange(evt.currentTarget.value);
      }}
      onBlur={onBlur}
      // See ../element.tsx
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus={autoFocus}
      className={cx(
        editorStyles,
        !valid && editorInvalidStyles,
        !valid &&
          (darkMode
            ? editorInvalidDarkModeStyles
            : editorInvalidLightModeStyles),
        className
      )}
      spellCheck="false"
    ></input>
  );
}
