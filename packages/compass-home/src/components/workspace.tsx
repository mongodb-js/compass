import React from 'react';
import { css } from '@mongodb-js/compass-components';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import { CompassShellPlugin } from '@mongodb-js/compass-shell';
import { CompassSchemaValidationPlugin } from '@mongodb-js/compass-schema-validation';
import {
  WorkspaceTab as CollectionWorkspace,
  CollectionTabsProvider,
} from '@mongodb-js/compass-collection';
import { CompassAggregationsPlugin } from '@mongodb-js/compass-aggregations';
import WorkspacesPlugin, {
  WorkspacesProvider,
} from '@mongodb-js/compass-workspaces';
import { WorkspaceTab as MyQueriesWorkspace } from '@mongodb-js/compass-saved-aggregations-queries';
import { WorkspaceTab as PerformanceWorkspace } from '@mongodb-js/compass-serverstats';
import {
  DatabasesWorkspaceTab,
  CollectionsWorkspaceTab,
} from '@mongodb-js/compass-databases-collections';
import { CompassDocumentsPlugin } from '@mongodb-js/compass-crud';
import { CompassSidebarPlugin } from '@mongodb-js/compass-sidebar';
import { CompassIndexesPlugin } from '@mongodb-js/compass-indexes';
import { CompassSchemaPlugin } from '@mongodb-js/compass-schema';
import CompassQueryBarPlugin from '@mongodb-js/compass-query-bar';

const verticalSplitStyles = css({
  width: '100vw',
  height: '100vh',
  display: 'grid',
  gridTemplateColumns: '1fr',
  gridTemplateRows: 'auto min-content',
  overflow: 'hidden',
});

const shellContainerStyles = css({
  zIndex: 5,
});

export default function Workspace({
  connectionInfo,
  onActiveWorkspaceTabChange,
  renderModals,
}: {
  connectionInfo: ConnectionInfo | null | undefined;
  onActiveWorkspaceTabChange: React.ComponentProps<
    typeof WorkspacesPlugin
  >['onActiveWorkspaceTabChange'];
  renderModals?: () => React.ReactElement;
}): React.ReactElement {
  return (
    <div data-testid="home" className={verticalSplitStyles}>
      <WorkspacesProvider
        value={[
          MyQueriesWorkspace,
          PerformanceWorkspace,
          DatabasesWorkspaceTab,
          CollectionsWorkspaceTab,
          CollectionWorkspace,
        ]}
      >
        <CollectionTabsProvider
          tabs={[
            CompassDocumentsPlugin,
            CompassAggregationsPlugin,
            CompassSchemaPlugin,
            CompassIndexesPlugin,
            CompassSchemaValidationPlugin,
          ]}
          queryBar={CompassQueryBarPlugin}
        >
          <WorkspacesPlugin
            initialWorkspaceTab={{ type: 'My Queries' }}
            onActiveWorkspaceTabChange={onActiveWorkspaceTabChange}
            renderSidebar={() => {
              return (
                <CompassSidebarPlugin
                  initialConnectionInfo={connectionInfo ?? undefined}
                />
              );
            }}
            renderModals={renderModals}
          ></WorkspacesPlugin>
        </CollectionTabsProvider>
      </WorkspacesProvider>
      <div className={shellContainerStyles}>
        <CompassShellPlugin />
      </div>
    </div>
  );
}
