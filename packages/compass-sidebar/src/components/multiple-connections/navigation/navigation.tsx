import {
  useHoverState,
  cx,
  spacing,
  css,
  mergeProps,
  useDefaultAction,
  Icon,
  Tooltip,
  SelectConnectionModal,
} from '@mongodb-js/compass-components';
import { useActiveConnections } from '@mongodb-js/compass-connections/provider';
import {
  useOpenWorkspace,
  useWorkspacePlugins,
} from '@mongodb-js/compass-workspaces/provider';
import { getConnectionTitle } from '@mongodb-js/connection-info';
import React, { useCallback, useMemo, useState } from 'react';

const navigationItem = css({
  cursor: 'pointer',
  color: 'var(--item-color)',
  position: 'relative',
  paddingLeft: spacing[400],

  '&[disabled]': {
    cursor: 'not-allowed',
    color: 'var(--item-color-disabled)',
    backgroundColor: 'var(--item-bg-color-disabled)',
  },

  '&:not([disabled]):hover .item-background': {
    display: 'block',
    backgroundColor: 'var(--item-bg-color-hover)',
  },

  '&:not([disabled]):hover': {
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

const disabledTooltipStyles = css({
  textAlign: 'center',
  display: 'inline-flex',
});

type NavigationItemProps = {
  glyph: string;
  label: string;
  isActive: boolean;
  onClick(): void;
  isDisabled?: boolean;
  disabledTooltip?: string;
};

export function NavigationItem({
  onClick: onButtonClick,
  glyph,
  label,
  isActive,
  isDisabled,
  disabledTooltip = 'Item cannot be navigated',
}: NavigationItemProps) {
  const [hoverProps] = useHoverState();
  const defaultActionProps = useDefaultAction(onButtonClick);

  const navigationItemProps = mergeProps(
    {
      className: cx(navigationItem, isActive && activeNavigationItem),
      role: 'button',
      ['aria-label']: label,
      ['aria-current']: isActive,
      ['aria-disabled']: !!isDisabled,
      tabIndex: 0,
      disabled: !!isDisabled,
    },
    hoverProps,
    defaultActionProps
  ) as React.HTMLProps<HTMLDivElement>;

  if (!isDisabled) {
    return (
      <div {...navigationItemProps}>
        <div className={itemButtonWrapper}>
          <Icon glyph={glyph} size="small"></Icon>
          <span className={navigationItemLabel}>{label}</span>
        </div>
      </div>
    );
  }

  return (
    <Tooltip
      align="top"
      justify="middle"
      trigger={({ children, ...props }) => (
        <div {...props} {...navigationItemProps}>
          <div className={itemButtonWrapper}>
            <Icon glyph={glyph} size="small"></Icon>
            <span className={navigationItemLabel}>{label}</span>
          </div>
          {children}
        </div>
      )}
    >
      <span className={disabledTooltipStyles}>{disabledTooltip}</span>
    </Tooltip>
  );
}

function ShellNavigationItem({
  openShellWorkspace,
  ...navigationItemProps
}: Omit<NavigationItemProps, 'onClick'> & {
  openShellWorkspace: ReturnType<typeof useOpenWorkspace>['openShellWorkspace'];
}) {
  const [selectedConnectionId, setSelectedConnectionId] = useState('');
  const [selectConnectionModalOpened, setSelectConnectionModalOpened] =
    useState(false);

  const activeConnections = useActiveConnections();
  const connectionsForModal = useMemo(() => {
    return activeConnections.map((connection) => {
      return {
        id: connection.id,
        name: getConnectionTitle(connection),
      };
    });
  }, [activeConnections]);

  const handleOpenShellWorkspace = useCallback(() => {
    if (activeConnections.length === 1) {
      const [{ id: connectionId }] = activeConnections;
      openShellWorkspace(connectionId, { newTab: true });
    } else if (activeConnections.length > 1) {
      setSelectConnectionModalOpened(true);
    }
  }, [activeConnections, openShellWorkspace, setSelectConnectionModalOpened]);

  const handleClose = useCallback(() => {
    setSelectConnectionModalOpened(false);
  }, []);

  const handleSubmit = useCallback(() => {
    setSelectConnectionModalOpened(false);
    openShellWorkspace(selectedConnectionId, { newTab: true });
  }, [selectedConnectionId, openShellWorkspace]);

  const handleConnectionSelected = useCallback((connectionId: string) => {
    setSelectedConnectionId(connectionId);
  }, []);

  return (
    <>
      <NavigationItem
        {...navigationItemProps}
        isDisabled={activeConnections.length === 0}
        disabledTooltip="Connect to a connection first"
        onClick={handleOpenShellWorkspace}
      />
      <SelectConnectionModal
        isModalOpen={selectConnectionModalOpened}
        isSubmitDisabled={!selectedConnectionId}
        submitButtonText="Open shell"
        connections={connectionsForModal}
        selectedConnectionId={selectedConnectionId}
        onClose={handleClose}
        onSubmit={handleSubmit}
        onConnectionSelected={handleConnectionSelected}
      />
    </>
  );
}

export function Navigation({
  currentLocation,
}: {
  currentLocation: string | null;
}): React.ReactElement {
  const { hasWorkspacePlugin } = useWorkspacePlugins();
  const { openMyQueriesWorkspace, openShellWorkspace } = useOpenWorkspace();

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
      {hasWorkspacePlugin('Shell') && (
        <ShellNavigationItem
          glyph="Shell"
          label="MongoDB Shell"
          isActive={currentLocation === 'Shell'}
          openShellWorkspace={openShellWorkspace}
        />
      )}
    </div>
  );
}
