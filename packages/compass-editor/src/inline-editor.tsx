import { cx } from '@mongodb-js/compass-components';
import React from 'react';
import type { EditorProps } from './base-editor';
import { Editor } from './base-editor';

type InlineEditorProps = EditorProps &
  Omit<
    EditorProps['options'],
    'showGutter' | 'highlightActiveLine' | 'highlightGutterLine' | 'minLines'
  >;

const InlineEditor: React.FunctionComponent<InlineEditorProps> = ({
  options,
  className,
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
    <Editor
      options={inlineEditorOptions}
      className={cx('inline-editor', className)}
      {...props}
    ></Editor>
  );
};

export { InlineEditor };
