import React, { useMemo } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { BSONValueContainer } from '../../bson-value';
import { documentTypography } from '../typography';
import { editorInvalidStyles, editorStyles } from './shared';
import type { EditorProps } from './shared';

const textareaContainer = css({
  width: '100%',
  maxWidth: '100%',
  '&::before, &::after': {
    content: "'\"'",
    userSelect: 'none',
  },
});

const editorTextarea = css({
  display: 'inline-block',
  whiteSpace: 'nowrap',
  minWidth: '5ch',
  // 2ch for `"` around the textarea
  maxWidth: 'calc(100% - 2ch)',
  verticalAlign: 'top',
  color: 'inherit',
});

export function TextEditor({
  value: val,
  valid,
  onChange,
  autoFocus,
  onBlur,
  ...props
}: Omit<EditorProps, 'type'>) {
  const inputStyle = useMemo(() => {
    const lines = val.split('\n');
    let longestLineCharLength = 0;
    for (const line of lines) {
      const length = line.length;
      if (length > longestLineCharLength) {
        longestLineCharLength = length;
      }
    }
    const width = `${Math.min(
      // Adding one to account for a textarea resize icon button thingie
      longestLineCharLength + 1,
      70
    )}ch`;
    const minLines = Math.max(lines.length, longestLineCharLength > 70 ? 2 : 1);
    const maxLines = Math.min(minLines, 10);
    const minHeight =
      documentTypography.lineHeight * Math.min(minLines, maxLines);
    const height = documentTypography.lineHeight * maxLines;

    return { width, minHeight, height };
  }, [val]);

  return (
    <BSONValueContainer type="String" className={cx(textareaContainer)}>
      <textarea
        data-testid="hadron-document-value-editor"
        value={val}
        onChange={(evt) => {
          onChange(evt.currentTarget.value);
        }}
        onBlur={onBlur}
        // See ../element.tsx
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        className={cx(
          editorStyles,
          editorTextarea,
          !valid && editorInvalidStyles
        )}
        spellCheck="false"
        style={inputStyle}
        {...(props as React.HTMLProps<HTMLTextAreaElement>)}
      ></textarea>
    </BSONValueContainer>
  );
}
