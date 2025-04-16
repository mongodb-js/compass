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
import { usePreference } from 'compass-preferences-model/provider';
import React from 'react';

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

const itemButtonWrapper = css({
  zIndex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: spacing[200],
  paddingTop: spacing[150],
  paddingBottom: spacing[150],
});

const navigationItemLabel = css({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
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
      <div className={itemButtonWrapper}>
        <Icon glyph={glyph} size="small"></Icon>
        <span className={navigationItemLabel}>{label}</span>
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
  const { openMyQueriesWorkspace, openDataModelingWorkspace } =
    useOpenWorkspace();
  const isDataModelingEnabled = usePreference('enableDataModeling');
  return (
    <div>
      {hasWorkspacePlugin('My Queries') && (
        <NavigationItem
          onClick={openMyQueriesWorkspace}
          glyph="CurlyBraces"
          label="My Queries"
          isActive={currentLocation === 'My Queries'}
        />
      )}
      {isDataModelingEnabled && (
        <NavigationItem
          onClick={openDataModelingWorkspace}
          glyph="Diagram"
          label="Data Modeling"
          isActive={currentLocation === 'Data Modeling'}
        />
      )}
    </div>
  );
}
