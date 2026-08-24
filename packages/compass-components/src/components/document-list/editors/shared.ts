import type React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import type { TypeCastMap } from 'hadron-type-checker';

const editorReset = css({
  padding: 0,
  margin: 0,
  border: 'none',
  boxShadow: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  maxWidth: '100%',
});

const editorOutline = css({
  '&:focus, &:active': {
    borderRadius: `2px`,
    boxShadow: `0 0 0 2px ${palette.blue.light1}`,
  },
});

export const editorStyles = cx(editorReset, editorOutline);

export const editorInvalidStyles = css({
  '&:focus, &:active': {
    boxShadow: `0 0 0 2px ${palette.red.dark2}`,
  },
});

export const editorInvalidLightModeStyles = css({
  backgroundColor: palette.red.light2,
  color: palette.red.dark2,
});

export const editorInvalidDarkModeStyles = css({
  backgroundColor: palette.red.dark2,
  color: palette.red.light2,
});

// Props coming from the tooltip trigger that are passed down to the underlying
// input element as-is
export type EditorInputProps = Omit<
  React.HTMLProps<HTMLInputElement>,
  'value' | 'onChange' | 'onBlur' | 'autoFocus'
>;

export type EditorProps = {
  autoFocus?: boolean;
  value: string;
  valid: boolean;
  onChange(newValue: string): void;
  onBlur(): void;
  type: keyof TypeCastMap;
} & EditorInputProps;
