import React, { useContext, useMemo } from 'react';
import { css, cx, spacing, Breadcrumbs } from '@mongodb-js/compass-components';
import type { BreadcrumbItem } from '@mongodb-js/compass-components';
import toNS from 'mongodb-ns';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';

const gridControlItemStyles = css({
  flex: 'none',
});

const pushRightStyles = css({
  marginLeft: 'auto',
});

const gridControlContainerStyles = css({
  display: 'flex',
  gap: spacing[2],
});

// We use this context to pass components that are aware of outer state of the
// v-list to the list header. This is needed so that we can define this outer
// component outside of the list component scope and avoid constant re-mounts
// when component constructor is re-created. We do this so that controls can be
// part of the list header and scroll up when the list is scrolled
export const ControlsContext = React.createContext<{
  createControls: React.ReactElement | null;
  refreshControls: React.ReactElement | null;
  viewTypeControls: React.ReactElement | null;
  sortControls: React.ReactElement | null;
}>({
  createControls: null,
  refreshControls: null,
  viewTypeControls: null,
  sortControls: null,
});

const GridControls = () => {
  const { createControls, refreshControls, viewTypeControls, sortControls } =
    useContext(ControlsContext);

  return (
    <div className={gridControlContainerStyles}>
      {createControls && (
        <div className={gridControlItemStyles} data-testid="create-controls">
          {createControls}
        </div>
      )}
      {refreshControls && (
        <div className={gridControlItemStyles} data-testid="refresh-controls">
          {refreshControls}
        </div>
      )}
      <div className={cx(gridControlItemStyles, pushRightStyles)}>
        {viewTypeControls}
      </div>
      <div className={gridControlItemStyles}>{sortControls}</div>
    </div>
  );
};

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  gap: spacing[3],
});

const breadcrumbStyles = css({
  display: 'flex',
});

export const GridHeader = ({ namespace }: { namespace?: string }) => {
  const { openDatabasesWorkspace, openCollectionsWorkspace } =
    useOpenWorkspace();

  const breadcrumbItems = useMemo(() => {
    return [
      {
        name: 'Cluster',
        onClick: () => openDatabasesWorkspace(),
      },
      namespace && {
        name: toNS(namespace).database,
        onClick: () => openCollectionsWorkspace(toNS(namespace).database),
      },
    ].filter(Boolean) as BreadcrumbItem[];
  }, [namespace, openDatabasesWorkspace, openCollectionsWorkspace]);
  return (
    <div className={containerStyles}>
      <div className={breadcrumbStyles}>
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <GridControls />
    </div>
  );
};

export const CONTROLS_HEIGHT = spacing[7] + spacing[3];
