import type { IconGlyph } from '@mongodb-js/compass-components';
import { cx } from '@mongodb-js/compass-components';
import { css, spacing } from '@mongodb-js/compass-components';
import type { Ace } from 'ace-builds';
import React, { useMemo, useRef } from 'react';
import { ActionButton, FormatIcon } from './actions';
import type { EditorProps as BaseEditorProps } from './base-editor';
import { BaseEditor } from './base-editor';

type CustomActionItem = {
  icon: IconGlyph;
  action: string;
  label: string;
};

type EditorProps = Omit<BaseEditorProps, 'editorClassName'> & {
  copyable?: boolean;
  formattable?: boolean;
  customActions?: CustomActionItem[];
  onAction?: (editor: Ace.Editor | undefined, action: string) => void;
};

const multilineEditorContainerStyle = css({
  position: 'relative',
  height: '100%',
  [`&:focus-within > .multiline-editor-actions,
    &:hover > .multiline-editor-actions`]: {
    display: 'flex',
  },
});

const editorContainerStyle = css({
  overflow: 'auto',
  // To account for the leafygreen button shadow on hover we add padding to the
  // top of the container that wraps the editor
  paddingTop: spacing[1],
  height: `calc(100% - ${spacing[1]}px)`,
  // We want folks to be able to click into the container element
  // they're using for the editor to focus the editor.
  minHeight: 'inherit',
});

const actionsContainerStyle = css({
  position: 'absolute',
  top: spacing[1],
  right: spacing[2],
  display: 'none',
  gap: spacing[2],
});

const MultilineEditor: React.FunctionComponent<EditorProps> = ({
  copyable = true,
  formattable = true,
  customActions = [],
  onAction,
  onLoad,
  className,
  ...props
}) => {
  const editorRef = useRef<Ace.Editor>();

  const actions = useMemo(() => {
    return [
      copyable && (
        <ActionButton
          key="Copy"
          label="Copy"
          icon="Copy"
          onClick={() => {
            editorRef.current?.execCommand('copy-all');
            return true;
          }}
        ></ActionButton>
      ),
      formattable && (
        <ActionButton
          key="Format"
          label="Format"
          icon={
            <FormatIcon
              size={/* leafygreen small */ 14}
              role="presentation"
            ></FormatIcon>
          }
          onClick={() => {
            editorRef.current?.execCommand('prettify');
            return true;
          }}
        ></ActionButton>
      ),
      ...customActions.map((action) => {
        return (
          <ActionButton
            key={action.action}
            icon={action.icon}
            label={action.label}
            onClick={() => {
              onAction?.(editorRef.current, action.action);
            }}
          ></ActionButton>
        );
      }),
    ];
  }, [copyable, formattable, customActions, onAction]);

  return (
    <div className={cx(multilineEditorContainerStyle, className)}>
      {/* Separate scrollable container for editor so that action buttons can */}
      {/* stay in one place when scrolling */}
      <div className={editorContainerStyle}>
        <BaseEditor
          onLoad={(editor) => {
            editorRef.current = editor;
            onLoad?.(editor);
          }}
          {...props}
        ></BaseEditor>
      </div>
      {actions.length > 0 && (
        <div className={cx('multiline-editor-actions', actionsContainerStyle)}>
          {actions}
        </div>
      )}
    </div>
  );
};

export { MultilineEditor as Editor };
