import React, { type RefObject } from 'react';

import { type Action, ActionButton, FormatIcon } from './action-button';
import type { EditorRef } from './types';
import { css, cx, spacing } from '@mongodb-js/compass-components';

type ActionsContainerProps = {
  copyable: boolean;
  formattable: boolean;
  customActions?: Action[];
  className?: string;
  editorRef: RefObject<EditorRef>;
};

const actionsContainerStyle = css({
  position: 'absolute',
  top: spacing[1],
  right: spacing[2],
  display: 'none',
  gap: spacing[2],
});

export const ActionsContainer = ({
  copyable,
  formattable,
  customActions,
  className,
  editorRef,
}: ActionsContainerProps) => {
  return (
    <div
      className={cx(
        'multiline-editor-actions',
        actionsContainerStyle,
        className
      )}
    >
      {copyable && (
        <ActionButton
          label="Copy"
          icon="Copy"
          onClick={() => {
            return editorRef.current?.copyAll() ?? false;
          }}
        ></ActionButton>
      )}
      {formattable && (
        <ActionButton
          label="Format"
          icon={
            <FormatIcon
              size={/* leafygreen small */ 14}
              role="presentation"
            ></FormatIcon>
          }
          onClick={() => {
            return editorRef.current?.prettify() ?? false;
          }}
        ></ActionButton>
      )}
      {customActions &&
        customActions.map((action) => {
          return (
            <ActionButton
              key={action.label}
              icon={action.icon}
              label={action.label}
              onClick={() => {
                if (!editorRef.current?.editor) {
                  return false;
                }
                return action.action(editorRef.current.editor);
              }}
            ></ActionButton>
          );
        })}
    </div>
  );
};
