import React from 'react';
import { css } from '@mongodb-js/compass-components';
import {
  CompassShellPlugin,
  WorkspaceTab as ShellWorkspace,
} from '@mongodb-js/compass-shell';
import {
  WorkspaceTab as CollectionWorkspace,
  CollectionTabsProvider,
} from '@mongodb-js/compass-collection';
import WorkspacesPlugin, {
  WorkspacesProvider,
} from '@mongodb-js/compass-workspaces';
import { WorkspaceTab as WelcomeWorkspace } from '@mongodb-js/compass-welcome';
import { WorkspaceTab as MyQueriesWorkspace } from '@mongodb-js/compass-saved-aggregations-queries';
import { WorkspaceTab as PerformanceWorkspace } from '@mongodb-js/compass-serverstats';
import {
  DatabasesWorkspaceTab,
  CollectionsWorkspaceTab,
} from '@mongodb-js/compass-databases-collections';
import { CompassSidebarPlugin } from '@mongodb-js/compass-sidebar';
import CompassQueryBarPlugin from '@mongodb-js/compass-query-bar';
import { CompassDocumentsPlugin } from '@mongodb-js/compass-crud';
import { CompassAggregationsPlugin } from '@mongodb-js/compass-aggregations';
import { CompassSchemaPlugin } from '@mongodb-js/compass-schema';
import {
  CompassIndexesPlugin,
  DropIndexPlugin as DropIndexCollectionTabModal,
  CreateIndexPlugin as CreateIndexCollectionTabModal,
} from '@mongodb-js/compass-indexes';
import { CompassSchemaValidationPlugin } from '@mongodb-js/compass-schema-validation';
import { CreateViewPlugin } from '@mongodb-js/compass-aggregations';
import {
  CreateNamespacePlugin,
  DropNamespacePlugin,
  RenameCollectionPlugin,
} from '@mongodb-js/compass-databases-collections';
import { ImportPlugin, ExportPlugin } from '@mongodb-js/compass-import-export';
import ExplainPlanCollectionTabModal from '@mongodb-js/compass-explain-plan';
import ExportToLanguageCollectionTabModal from '@mongodb-js/compass-export-to-language';
import {
  ConnectionInfoProvider,
  useActiveConnections,
} from '@mongodb-js/compass-connections/provider';
import { usePreference } from 'compass-preferences-model/provider';

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
  onActiveWorkspaceTabChange,
}: {
  onActiveWorkspaceTabChange: React.ComponentProps<
    typeof WorkspacesPlugin
  >['onActiveWorkspaceTabChange'];
}): React.ReactElement {
  const [activeConnection] = useActiveConnections();
  const multiConnectionsEnabled = usePreference(
    'enableNewMultipleConnectionSystem'
  );
  return (
    <div data-testid="home" className={verticalSplitStyles}>
      <WorkspacesProvider
        value={[
          WelcomeWorkspace,
          MyQueriesWorkspace,
          ShellWorkspace,
          PerformanceWorkspace,
          DatabasesWorkspaceTab,
          CollectionsWorkspaceTab,
          CollectionWorkspace,
        ]}
      >
        <CollectionTabsProvider
          queryBar={CompassQueryBarPlugin}
          tabs={[
            CompassDocumentsPlugin,
            CompassAggregationsPlugin,
            CompassSchemaPlugin,
            CompassIndexesPlugin,
            CompassSchemaValidationPlugin,
          ]}
          modals={[
            ExplainPlanCollectionTabModal,
            DropIndexCollectionTabModal,
            CreateIndexCollectionTabModal,
            ExportToLanguageCollectionTabModal,
          ]}
        >
          <WorkspacesPlugin
            initialWorkspaceTabs={[
              { type: multiConnectionsEnabled ? 'Welcome' : 'My Queries' },
            ]}
            onActiveWorkspaceTabChange={onActiveWorkspaceTabChange}
            renderSidebar={() => <CompassSidebarPlugin />}
            renderModals={() => (
              <>
                <ImportPlugin></ImportPlugin>
                <ExportPlugin></ExportPlugin>
                <CreateViewPlugin></CreateViewPlugin>
                <CreateNamespacePlugin></CreateNamespacePlugin>
                <DropNamespacePlugin></DropNamespacePlugin>
                <RenameCollectionPlugin></RenameCollectionPlugin>
              </>
            )}
          ></WorkspacesPlugin>
        </CollectionTabsProvider>
      </WorkspacesProvider>
      {!multiConnectionsEnabled && (
        <div className={shellContainerStyles}>
          <ConnectionInfoProvider connectionInfoId={activeConnection?.id}>
            <CompassShellPlugin />
          </ConnectionInfoProvider>
        </div>
      )}
    </div>
  );
}
