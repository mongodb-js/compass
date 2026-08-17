import React, { useMemo } from 'react';
import type { EditorProps } from './shared';
import { InputEditor } from './input-editor';

export function DefaultEditor({ value, ...props }: Omit<EditorProps, 'label'>) {
  const inputStyle = useMemo(() => {
    return { width: `${Math.max(value.length, 1)}ch` };
  }, [value]);

  return <InputEditor value={value} {...props} style={inputStyle} />;
}
