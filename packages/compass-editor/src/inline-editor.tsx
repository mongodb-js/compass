import React from 'react';
import type { EditorProps } from './base-editor';
import { BaseEditor } from './base-editor';

type InlineEditorProps = Omit<EditorProps, 'options' | 'editorClassName'> & {
  options?: Omit<
    EditorProps['options'],
    'showGutter' | 'highlightActiveLine' | 'highlightGutterLine' | 'minLines'
  >;
};

const InlineEditor: React.FunctionComponent<InlineEditorProps> = ({
  options,
  ...props
}) => {
  const inlineEditorOptions = {
    maxLines: 10,
    ...options,
    minLines: 1,
    showGutter: false,
    highlightActiveLine: false,
    highlightGutterLine: false,
  };
  return (
    <BaseEditor
      options={inlineEditorOptions}
      editorClassName="inline-editor"
      {...props}
    ></BaseEditor>
  );
};

export { InlineEditor };
