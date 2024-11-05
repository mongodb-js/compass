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
  onExpand?: () => void;
  expanded?: boolean;
};

const actionsContainerStyle = css({
  position: 'absolute',
  top: spacing[100],
  right: spacing[100],
  left: spacing[100],
  display: 'none',
  gap: spacing[200],
  pointerEvents: 'none',
});

const expandContainerStyle = css({
  position: 'relative',
  top: -spacing[100],
  left: -spacing[100],
});

const actionsGroupItemSeparator = css({
  flex: '1 0 auto',
  pointerEvents: 'none',
});

export const ActionsContainer = ({
  copyable,
  formattable,
  customActions,
  className,
  editorRef,
  onExpand,
  expanded,
}: ActionsContainerProps) => {
  return (
    <div
      className={cx(
        'multiline-editor-actions',
        actionsContainerStyle,
        className
      )}
    >
      {onExpand && (
        <div className={expandContainerStyle}>
          <ActionButton
            label={expanded ? 'Collapse all' : 'Expand all'}
            icon={expanded ? 'CaretDown' : 'CaretRight'}
            onClick={onExpand}
            compact
          />
        </div>
      )}
      <span className={actionsGroupItemSeparator}></span>
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
