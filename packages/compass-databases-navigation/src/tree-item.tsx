/* eslint-disable react/prop-types */
import React, { useCallback } from 'react';
import type { CSSProperties } from 'react';
import {
  useFocusRing,
  css,
  cx,
  mergeProps,
  spacing,
} from '@mongodb-js/compass-components';
import type { Actions } from './constants';

export type VirtualListItemProps = {
  style?: CSSProperties;
};

export type TreeItemProps = {
  id: string;
  posInSet: number;
  setSize: number;
  isTabbable: boolean;
};

export type NamespaceItemProps = {
  name: string;
  type: string;
  isActive: boolean;
  isReadOnly: boolean;
  onNamespaceAction(namespace: string, action: Actions): void;
};

export function useDefaultAction<T>(
  onDefaultAction: (evt: React.KeyboardEvent<T> | React.MouseEvent<T>) => void
): React.HTMLAttributes<T> {
  const onClick = useCallback(
    (evt: React.MouseEvent<T>) => {
      evt.stopPropagation();
      onDefaultAction(evt);
    },
    [onDefaultAction]
  );

  const onKeyDown = useCallback(
    (evt: React.KeyboardEvent<T>) => {
      if (
        // Only handle keyboard events if they originated on the element
        evt.target === evt.currentTarget &&
        [' ', 'Enter'].includes(evt.key)
      ) {
        evt.preventDefault();
        evt.stopPropagation();
        onDefaultAction(evt);
      }
    },
    [onDefaultAction]
  );

  return { onClick, onKeyDown };
}

const itemContainer = css({
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  color: 'var(--item-color)',
  backgroundColor: 'var(--item-bg-color)',

  svg: {
    flexShrink: 0,
  },
});

const activeItemContainer = css({
  color: 'var(--item-color-active)',
  backgroundColor: 'var(--item-bg-color-active)',
  fontWeight: 'bold',

  ':hover': {
    backgroundColor: 'transparent',
  },

  // this is copied from leafygreen's own navigation, hence the pixel values
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

export const ItemContainer: React.FunctionComponent<
  {
    id: string;
    level: number;
    setSize: number;
    posInSet: number;
    isExpanded?: boolean;
    isActive?: boolean;
    isTabbable?: boolean;
    onDefaultAction(
      evt:
        | React.KeyboardEvent<HTMLDivElement>
        | React.MouseEvent<HTMLDivElement>
    ): void;
  } & React.HTMLProps<HTMLDivElement>
> = ({
  id,
  level,
  setSize,
  posInSet,
  isExpanded,
  isActive,
  isTabbable,
  onDefaultAction,
  children,
  className,
  ...props
}) => {
  const focusRingProps = useFocusRing();
  const defaultActionProps = useDefaultAction(onDefaultAction);

  const extraCSS = [];
  if (isActive) {
    extraCSS.push(activeItemContainer);
  }

  const treeItemProps = mergeProps(
    {
      role: 'treeitem',
      'aria-level': level,
      'aria-setsize': setSize,
      'aria-posinset': posInSet,
      'aria-expanded': isExpanded,
      tabIndex: isTabbable ? 0 : -1,
      className: cx(itemContainer, ...extraCSS, className),
    },
    props,
    defaultActionProps,
    focusRingProps
  );

  return (
    <div data-id={id} data-testid={`sidebar-database-${id}`} {...treeItemProps}>
      {children}
    </div>
  );
};

const itemLabel = css({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
});

export const ItemLabel: React.FunctionComponent<
  React.HTMLProps<HTMLSpanElement>
> = ({ children, className, ...props }) => {
  return (
    <span className={cx(itemLabel, className)} {...props}>
      {children}
    </span>
  );
};

function iconsPadding(numIcons: number) {
  return numIcons === 2 ? spacing[4] + spacing[5] : spacing[5];
}

const itemWrapper = css({
  position: 'relative',
  width: '100%',
});

export const ItemWrapper: React.FunctionComponent<
  {
    numIcons?: number;
  } & React.HTMLProps<HTMLDivElement>
> = ({ numIcons = 1, className, children }) => {
  return (
    <div
      className={cx(
        itemWrapper,
        className,
        css({
          [`:hover [data-testid="button-wrapper"]`]: {
            paddingRight: iconsPadding(numIcons),
          },
        })
      )}
    >
      {children}
    </div>
  );
};

const itemButtonWrapper = css({
  display: 'flex',
  alignItems: 'center',
  width: '100%',

  ':hover': {
    backgroundColor: 'var(--item-bg-color-hover)',
  },
});

const itemButtonWrapperActive = css({
  ':hover': {
    backgroundColor: 'var(--item-bg-color-active)',
  },
});

export const ItemButtonWrapper: React.FunctionComponent<
  {
    numIcons?: number;
    isActive?: boolean;
  } & React.HTMLProps<HTMLDivElement>
> = ({ numIcons = 1, isActive, className, children }) => {
  return (
    <div
      data-testid="button-wrapper"
      className={cx(
        itemButtonWrapper,
        isActive && itemButtonWrapperActive,
        className,
        isActive &&
          css({
            paddingRight: iconsPadding(numIcons),
          })
      )}
    >
      {children}
    </div>
  );
};

export const itemActionControlsStyles = css({
  position: 'absolute',
  top: spacing[1],
  right: spacing[1],
});
