import React from 'react';
import {
  useHoverState,
  spacing,
  css,
  ItemActionControls,
  cx,
} from '@mongodb-js/compass-components';
import { ROW_HEIGHT, type Actions } from './constants';
import { ExpandButton } from './tree-item';
import { type NavigationItemActions } from './item-actions';

type NavigationBaseItemProps = {
  name: string;
  isActive: boolean;
  canExpand: boolean;
  isExpanded: boolean;
  isFocused: boolean;
  icon: React.ReactNode;
  style: React.CSSProperties;

  dataAttributes?: Record<string, string | undefined>;
  actionProps: {
    collapseAfter?: number;
    collapseToMenuThreshold?: number;
    actions: NavigationItemActions;
    onAction: (action: Actions) => void;
  };
  onExpand: (toggle: boolean) => void;
};

const menuStyles = css({
  width: '240px',
  maxHeight: 'unset',
  marginLeft: 'auto',
});

const itemContainerStyles = css({
  paddingLeft: spacing[300],
  paddingRight: spacing[300],
  cursor: 'pointer',
  color: 'var(--item-color)',
  backgroundColor: 'var(--item-bg-color)',
  '&[data-is-active="true"] .item-wrapper': {
    fontWeight: 600,
    color: 'var(--item-color-active)',
    backgroundColor: 'var(--item-bg-color-active)',
  },
  '&:hover:not([data-is-active="true"]) .item-wrapper': {
    backgroundColor: 'var(--item-bg-color-hover)',
  },
  svg: {
    flexShrink: 0,
  },
});

const itemWrapperStyles = css({
  display: 'flex',
  height: ROW_HEIGHT,
  alignItems: 'center',
  paddingLeft: spacing[100],
  paddingRight: spacing[100],
  gap: spacing[50],
  borderRadius: spacing[100],
});

const labelAndIconWrapperStyles = css({
  width: '100%',
  display: 'flex',
  gap: spacing[150],
  overflow: 'hidden',
  alignItems: 'center',
  '& span': {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
});

const actionControlsWrapperStyles = css({
  display: 'flex',
  marginLeft: 'auto',
  alignItems: 'center',
  gap: spacing[100],
});

export const NavigationBaseItem: React.FC<NavigationBaseItemProps> = ({
  isActive,
  actionProps,
  name,
  style,
  icon,
  dataAttributes,
  canExpand,
  isExpanded,
  isFocused,
  onExpand,
  children,
}) => {
  const [hoverProps, isHovered] = useHoverState();
  return (
    <div
      data-testid="base-navigation-item"
      className={itemContainerStyles}
      {...hoverProps}
      {...dataAttributes}
    >
      <div className={cx('item-wrapper', itemWrapperStyles)} style={style}>
        {canExpand && (
          <ExpandButton
            onClick={(evt) => {
              evt.stopPropagation();
              onExpand(!isExpanded);
            }}
            isExpanded={isExpanded}
          ></ExpandButton>
        )}
        <div className={labelAndIconWrapperStyles}>
          {icon}
          <span title={name}>{name}</span>
        </div>
        <div className={actionControlsWrapperStyles}>
          <ItemActionControls<Actions>
            menuClassName={menuStyles}
            isVisible={isActive || isHovered || isFocused}
            data-testid="sidebar-navigation-item-actions"
            iconSize="xsmall"
            {...actionProps}
          ></ItemActionControls>
          {children}
        </div>
      </div>
    </div>
  );
};
