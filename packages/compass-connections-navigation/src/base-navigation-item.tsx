import React from 'react';
import {
  useHoverState,
  spacing,
  css,
  ItemActionControls,
  cx,
  Badge,
  BadgeVariant,
  Tooltip,
  useDarkMode,
  Body,
} from '@mongodb-js/compass-components';
import { type Actions, ROW_HEIGHT } from './constants';
import { ExpandButton } from './tree-item';
import { type NavigationItemActions } from './item-actions';
import type {
  ConnectedConnectionTreeItem,
  NotConnectedConnectionTreeItem,
  SidebarTreeItem,
} from './tree-data';

type NavigationBaseItemProps = React.PropsWithChildren<{
  item: SidebarTreeItem;
  name: string;
  isActive: boolean;
  isExpandVisible: boolean;
  isExpandDisabled: boolean;
  isExpanded: boolean;
  isFocused: boolean;
  hasDefaultAction: boolean;
  icon: React.ReactNode;
  style: React.CSSProperties;

  dataAttributes?: Record<string, string | undefined>;
  actionProps: {
    collapseAfter?: number;
    collapseToMenuThreshold?: number;
    actions: NavigationItemActions;
    onAction: (action: Actions) => void;
  };
  toggleExpand: () => void;
}>;

const menuStyles = css({
  width: '240px',
  maxHeight: 'unset',
  marginLeft: 'auto',
});

const itemContainerStyles = css({
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

const itemContainerWithActionStyles = css({
  cursor: 'pointer',
});

const itemWrapperStyles = css({
  display: 'flex',
  height: ROW_HEIGHT,
  alignItems: 'center',
  paddingRight: spacing[400],
  gap: spacing[50],
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
  fontSize: '12px',
});

const actionControlsWrapperStyles = css({
  display: 'flex',
  marginLeft: 'auto',
  alignItems: 'center',
  gap: spacing[100],
});

const ClusterStateBadge: React.FunctionComponent<{
  state: string;
}> = ({ state }) => {
  const badgeVariant =
    state === 'CREATING'
      ? BadgeVariant.Blue
      : state === 'DELETED'
      ? BadgeVariant.Red
      : BadgeVariant.LightGray;
  const badgeText =
    state === 'DELETING'
      ? 'TERMINATING'
      : state === 'DELETED'
      ? 'TERMINATED'
      : state;

  return (
    <Badge variant={badgeVariant} data-testid="navigation-item-state-badge">
      {badgeText}
    </Badge>
  );
};

const ClusterStateBadgeWithTooltip: React.FunctionComponent<{
  item: ConnectedConnectionTreeItem | NotConnectedConnectionTreeItem;
}> = ({ item }) => {
  const isDarkMode = useDarkMode();

  const atlasClusterState = item.connectionInfo.atlasMetadata?.clusterState;
  if (atlasClusterState === 'PAUSED') {
    return (
      <Tooltip
        enabled={true}
        darkMode={isDarkMode}
        trigger={({
          children: tooltipChildren,
          ...tooltipTriggerProps
        }: React.HTMLProps<HTMLDivElement>) => (
          <div {...tooltipTriggerProps}>
            <ClusterStateBadge state={atlasClusterState} />
            {tooltipChildren}
          </div>
        )}
      >
        <Body>Unpause your cluster to connect to it</Body>
      </Tooltip>
    );
  } else if (
    atlasClusterState === 'DELETING' ||
    atlasClusterState === 'CREATING' ||
    atlasClusterState === 'DELETED'
  ) {
    return <ClusterStateBadge state={atlasClusterState} />;
  }

  return null;
};

export const NavigationBaseItem = React.forwardRef<
  HTMLDivElement,
  NavigationBaseItemProps
>(function NavigationBaseItem(
  {
    item,
    isActive,
    actionProps,
    name,
    style,
    icon,
    dataAttributes,
    isExpandVisible,
    isExpandDisabled,
    isExpanded,
    isFocused,
    hasDefaultAction,
    toggleExpand,
    children,
  },
  ref
) {
  const [hoverProps, isHovered] = useHoverState();

  return (
    <div
      ref={ref}
      data-testid="base-navigation-item"
      className={cx(itemContainerStyles, {
        [itemContainerWithActionStyles]: hasDefaultAction,
      })}
      {...hoverProps}
      {...dataAttributes}
    >
      <div className={cx('item-wrapper', itemWrapperStyles)} style={style}>
        {isExpandVisible && (
          <ExpandButton
            onClick={(event) => {
              // Prevent the click from propagating to the `TreeItem`, triggering the default action
              event.stopPropagation();
              toggleExpand();
            }}
            isExpanded={isExpanded}
            disabled={isExpandDisabled}
          ></ExpandButton>
        )}
        <div className={labelAndIconWrapperStyles}>
          {icon}
          <span title={name}>{name}</span>
        </div>
        {item.type === 'connection' && (
          <ClusterStateBadgeWithTooltip item={item} />
        )}
        <div className={actionControlsWrapperStyles}>
          <ItemActionControls
            menuClassName={menuStyles}
            isVisible={isActive || isHovered || isFocused}
            data-testid="sidebar-navigation-item-actions"
            iconSize="xsmall"
            {...actionProps}
          />
          {children}
        </div>
      </div>
    </div>
  );
});
