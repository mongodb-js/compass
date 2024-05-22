import React from 'react';
import type { CSSProperties } from 'react';
import {
  css,
  cx,
  mergeProps,
  spacing,
  Icon,
} from '@mongodb-js/compass-components';
import type { Actions } from './constants';
import { usePreference } from 'compass-preferences-model/provider';

const buttonReset = css({
  padding: 0,
  margin: 0,
  background: 'none',
  border: 'none',
});

const expandButton = css({
  display: 'flex',
  // Not using leafygreen spacing here because none of them allow to align the
  // button with the search bar content. This probably can go away when we are
  // rebuilding the search also
  padding: 7,
  transition: 'transform .16s linear',
  transform: 'rotate(0deg)',
  '&:hover': {
    cursor: 'pointer',
  },
});

const expanded = css({
  transform: 'rotate(90deg)',
});

export type VirtualListItemProps = {
  style?: CSSProperties;
};

export type NamespaceItemProps = {
  connectionId: string;
  isActive: boolean;
  isReadOnly: boolean;
  isSingleConnection?: boolean;
  onNamespaceAction(
    connectionId: string,
    namespace: string,
    action: Actions
  ): void;
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
      <Icon glyph="CaretRight" size="small"></Icon>
    </button>
  );
};

const itemContainer = css({
  cursor: 'pointer',
  color: 'var(--item-color)',
  backgroundColor: 'var(--item-bg-color)',
  backgroundRadius: 'var(--item-bg-radius)',

  '.item-background': {
    backgroundColor: 'var(--item-bg-color)',
  },

  '& .item-action-controls': {
    marginLeft: 'auto',
  },

  '&:hover .item-background': {
    display: 'block',
    backgroundColor: 'var(--item-bg-color-hover)',
  },

  '&:hover': {
    backgroundColor: 'var(--item-bg-color-hover)',
  },

  '& .item-action-controls:hover + .item-background': {
    display: 'none',
  },

  svg: {
    flexShrink: 0,
  },
});

const activeItemContainer = css({
  color: 'var(--item-color-active)',
  backgroundColor: 'var(--item-bg-color-active)',
  fontWeight: 'bold',

  '&:hover': {
    backgroundColor: 'var(--item-bg-color-active)',
  },
});

const legacyActiveItemContainer = css({
  color: 'var(--item-color-active)',
  backgroundColor: 'var(--item-bg-color-active)',
  fontWeight: 'bold',

  '&:hover': {
    backgroundColor: 'var(--item-bg-color-active)',
  },

  '::before': {
    zIndex: 1,
    backgroundColor: 'var(--item-color-active)',
    content: '""',
    position: 'absolute',
    left: '0px',
    top: '6px',
    bottom: '6px',
    width: '4px',
    borderRadius: '0px 6px 6px 0px',
  },
});

const itemWrapper = css({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  paddingRight: spacing[100],
});

const itemBackground = css({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: -1,
});

const itemButtonWrapper = css({
  display: 'flex',
  alignItems: 'center',
  minWidth: 0,
});

const itemLabel = css({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
});

export const ItemContainer: React.FunctionComponent<
  {
    isActive?: boolean;
  } & React.HTMLProps<HTMLDivElement>
> = ({ isActive, children, className, ...props }) => {
  const isMultipleConnection = usePreference(
    'enableNewMultipleConnectionSystem'
  );
  const extraCSS = [];
  if (isActive) {
    if (isMultipleConnection) {
      extraCSS.push(activeItemContainer);
    } else {
      extraCSS.push(legacyActiveItemContainer);
    }
  }

  const allProps = mergeProps(props, {
    className: cx(itemContainer, ...extraCSS, className),
  });

  return <div {...allProps}>{children}</div>;
};

export const ItemWrapper: React.FunctionComponent<
  React.HTMLProps<HTMLDivElement>
> = ({ className, children }) => {
  return (
    <div className={cx(itemWrapper, className)}>
      {children}
      <div className={cx('item-background', itemBackground)} />
    </div>
  );
};

export const ItemButtonWrapper: React.FunctionComponent<
  React.HTMLProps<HTMLDivElement>
> = ({ className, children, ...rest }) => {
  return (
    <div className={cx(itemButtonWrapper, className)} {...rest}>
      {children}
    </div>
  );
};

export const ItemLabel: React.FunctionComponent<
  React.HTMLProps<HTMLSpanElement>
> = ({ children, className, ...props }) => {
  return (
    <span className={cx(itemLabel, className)} {...props}>
      {children}
    </span>
  );
};
