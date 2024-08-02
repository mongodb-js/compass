import React from 'react';
import type { CSSProperties } from 'react';
import { css, cx, Icon, spacing } from '@mongodb-js/compass-components';

const buttonReset = css({
  padding: 0,
  margin: 0,
  background: 'none',
  border: 'none',
});

const expandButton = css({
  display: 'flex',
  transition: 'transform .16s linear',
  transform: 'rotate(0deg)',
  '&:hover': {
    cursor: 'pointer',
  },
  // we're sizing the icon down below but we still want the button to take up
  // 16px so that the grid lines up
  minWidth: spacing[400],
  height: spacing[400],
  alignItems: 'center',
  justifyContent: 'center',
});

const expanded = css({
  transform: 'rotate(90deg)',
});

export type VirtualListItemProps = {
  style?: CSSProperties;
};

export const ExpandButton: React.FunctionComponent<{
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  isExpanded: boolean;
}> = ({ onClick, isExpanded }) => {
  return (
    <button
      type="button"
      // We don't want this button to be part of the navigation sequence as
      // this breaks the tab flow when navigating through the tree. If you
      // are focused on a particular item in the list, you can expand /
      // collapse it using keyboard, so the button is only valuable when
      // using a mouse
      tabIndex={-1}
      onClick={onClick}
      className={cx(buttonReset, expandButton, isExpanded && expanded)}
    >
      <Icon width={14} height={14} glyph="CaretRight" size="small"></Icon>
    </button>
  );
};
