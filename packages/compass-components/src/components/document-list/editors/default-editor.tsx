import React, { useMemo } from 'react';
import type { EditorProps } from './shared';
import { InputEditor } from './input-editor';
import { EditorWithLabel } from './editor-with-label';

export function DefaultEditor({ value, type, ...props }: EditorProps) {
  const inputStyle = useMemo(() => {
    return { width: `${Math.max(value.length, 1)}ch` };
  }, [value]);
  return (
    <EditorWithLabel type={type}>
      <InputEditor value={value} {...props} style={inputStyle} />
    </EditorWithLabel>
  );
}
