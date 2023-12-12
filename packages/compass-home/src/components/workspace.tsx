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
import { CompassIndexesPlugin } from '@mongodb-js/compass-indexes';

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
}: {
  connectionInfo: ConnectionInfo | null | undefined;
  onActiveWorkspaceTabChange: React.ComponentProps<
    typeof WorkspacesPlugin
  >['onActiveWorkspaceTabChange'];
}): React.ReactElement {
  // CompassSchemaPlugin requires leaflet which does not render outside of Electron
  let CompassSchemaPlugin: // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  typeof import('@mongodb-js/compass-schema').CompassSchemaPlugin | undefined;
  try {
    CompassSchemaPlugin =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('@mongodb-js/compass-schema').CompassSchemaPlugin;
  } catch (err) {
    if (globalThis?.window) throw err;
  }
  return (
    <div data-testid="home" className={verticalSplitStyles}>
      <WorkspacesProvider
        value={[
          MyQueriesWorkspace,
          PerformanceWorkspace,
          DatabasesWorkspaceTab,
          // TODO: issue because of the recursive dep?
          CollectionsWorkspaceTab as any,
          CollectionWorkspace,
        ]}
      >
        <CollectionTabsProvider
          tabs={[
            CompassDocumentsPlugin,
            CompassAggregationsPlugin,
            ...(CompassSchemaPlugin ? [CompassSchemaPlugin] : []),
            CompassIndexesPlugin,
            CompassSchemaValidationPlugin,
          ]}
        >
          <WorkspacesPlugin
            initialWorkspaceTab={{ type: 'My Queries' }}
            onActiveWorkspaceTabChange={onActiveWorkspaceTabChange}
            // TODO(COMPASS-7397): pass through for sidebar
            initialConnectionInfo={connectionInfo ?? undefined}
          ></WorkspacesPlugin>
        </CollectionTabsProvider>
      </WorkspacesProvider>
      <div className={shellContainerStyles}>
        <CompassShellPlugin />
      </div>
    </div>
  );
}
