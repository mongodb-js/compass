/* eslint-disable react/prop-types */
import React, { useCallback } from 'react';
import type { CSSProperties } from 'react';
import {
  useFocusRing,
  css,
  cx,
  mergeProps,
} from '@mongodb-js/compass-components';
import {
  backgroundColorActive,
  backgroundColor,
  backgroundColorHover,
} from './constants';
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
  backgroundColor: backgroundColor,
  cursor: 'pointer',
});

const activeBackground = css({
  backgroundColor: backgroundColorActive,
});

const hoverBackground = css({
  backgroundColor: backgroundColorHover,
});

export const ItemContainer: React.FunctionComponent<
  {
    id: string;
    level: number;
    setSize: number;
    posInSet: number;
    isExpanded?: boolean;
    isActive?: boolean;
    isHovered?: boolean;
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
  isHovered,
  isTabbable,
  onDefaultAction,
  children,
  className,
  ...props
}) => {
  const focusRingProps = useFocusRing<HTMLDivElement>();
  const defaultActionProps = useDefaultAction(onDefaultAction);

  const treeItemProps = mergeProps(
    {
      role: 'treeitem',
      'aria-level': level,
      'aria-setsize': setSize,
      'aria-posinset': posInSet,
      'aria-expanded': isExpanded,
      tabIndex: isTabbable ? 0 : -1,
      className: cx(
        itemContainer,
        isActive ? activeBackground : isHovered && hoverBackground,
        className
      ),
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
