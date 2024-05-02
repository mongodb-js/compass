import {
  useHoverState,
  cx,
  spacing,
  css,
  mergeProps,
  useDefaultAction,
  Icon,
} from '@mongodb-js/compass-components';
import {
  useOpenWorkspace,
  useWorkspacePlugins,
} from '@mongodb-js/compass-workspaces/provider';
import React from 'react';

const navigationContainer = css({
  padding: `0px 0px ${spacing[200]}px`,
});

const navigationItem = css({
  cursor: 'pointer',
  color: 'var(--item-color)',
  position: 'relative',
  paddingLeft: spacing[400],

  '&:hover .item-background': {
    display: 'block',
    backgroundColor: 'var(--item-bg-color-hover)',
  },

  '&:hover': {
    backgroundColor: 'var(--item-bg-color-hover)',
  },

  svg: {
    flexShrink: 0,
  },
});

const activeNavigationItem = css({
  color: 'var(--item-color-active)',
  fontWeight: 'bold',
  backgroundColor: 'var(--item-bg-color-active)',
});

const itemWrapper = css({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  height: spacing[800],
  gap: spacing[200],
  zIndex: 1,
});

const itemButtonWrapper = css({
  display: 'flex',
  alignItems: 'center',
  minWidth: 0,
});

const navigationItemLabel = css({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  marginLeft: spacing[200],
});

export function NavigationItem({
  onClick: onButtonClick,
  glyph,
  label,
  isActive,
}: {
  onClick(): void;
  glyph: string;
  label: string;
  isActive: boolean;
}) {
  const [hoverProps] = useHoverState();
  const defaultActionProps = useDefaultAction(onButtonClick);

  const navigationItemProps = mergeProps(
    {
      className: cx(navigationItem, isActive && activeNavigationItem),
      role: 'button',
      ['aria-label']: label,
      ['aria-current']: isActive,
      tabIndex: 0,
    },
    hoverProps,
    defaultActionProps
  ) as React.HTMLProps<HTMLDivElement>;

  return (
    <div {...navigationItemProps}>
      <div className={itemWrapper}>
        <div className={itemButtonWrapper}>
          <Icon glyph={glyph} size="small"></Icon>
          <span className={navigationItemLabel}>{label}</span>
        </div>
      </div>
    </div>
  );
}

export function Navigation({
  currentLocation,
}: {
  currentLocation: string | null;
}): React.ReactElement {
  const { hasWorkspacePlugin } = useWorkspacePlugins();
  const { openMyQueriesWorkspace } = useOpenWorkspace();
  return (
    <div className={navigationContainer}>
      {hasWorkspacePlugin('My Queries') && (
        <NavigationItem
          onClick={openMyQueriesWorkspace}
          glyph="CurlyBraces"
          label="My Queries"
          isActive={currentLocation === 'My Queries'}
        />
      )}
    </div>
  );
}
