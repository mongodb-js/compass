import React, { useMemo } from 'react';
import { css } from '@leafygreen-ui/emotion';
import type { EditorProps } from './shared';
import { EditorWithLabel } from './editor-with-label';
import { InputEditor } from './input-editor';

const uuidEditorInput = css({
  display: 'inline-block',
  whiteSpace: 'nowrap',
  verticalAlign: 'top',
  color: 'inherit',
});

export function UUIDEditor({ value, type, ...props }: EditorProps) {
  const inputStyle = useMemo(() => {
    // UUID format is 36 characters (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    return { width: `${Math.max(value.length, 36)}ch` };
  }, [value]);

  return (
    <EditorWithLabel type={type}>
      <InputEditor
        value={value}
        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        {...props}
        className={uuidEditorInput}
        style={inputStyle}
      />
    </EditorWithLabel>
  );
}
