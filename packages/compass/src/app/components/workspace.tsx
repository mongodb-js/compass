import React, { useCallback } from 'react';
import { WorkspaceTab as ShellWorkspace } from '@mongodb-js/compass-shell';
import {
  WorkspaceTab as CollectionWorkspace,
  CollectionTabsProvider,
} from '@mongodb-js/compass-collection';
import type {
  WorkspaceTab,
  CollectionTabInfo,
} from '@mongodb-js/compass-workspaces';

import WorkspacesPlugin, {
  WorkspacesProvider,
} from '@mongodb-js/compass-workspaces';
import { DesktopWorkspaceTab as WelcomeWorkspace } from '@mongodb-js/compass-welcome';
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
import { CompassIndexesPlugin } from '@mongodb-js/compass-indexes';
import { CompassSchemaValidationPlugin } from '@mongodb-js/compass-schema-validation';
import { CompassGlobalWritesPlugin } from '@mongodb-js/compass-global-writes';
import { CreateViewPlugin } from '@mongodb-js/compass-aggregations';
import {
  CreateNamespacePlugin,
  DropNamespacePlugin,
  RenameCollectionPlugin,
} from '@mongodb-js/compass-databases-collections';
import { ImportPlugin, ExportPlugin } from '@mongodb-js/compass-import-export';
import ExplainPlanCollectionTabModal from '@mongodb-js/compass-explain-plan';
import ExportToLanguageCollectionTabModal from '@mongodb-js/compass-export-to-language';
import updateTitle from '../utils/update-title';
import { getConnectionTitle } from '@mongodb-js/connection-info';
import { useConnectionsListRef } from '@mongodb-js/compass-connections/provider';
import { DataModelingWorkspaceTab } from '@mongodb-js/compass-data-modeling';

export default function Workspace({
  appName,
  onActiveWorkspaceTabChange,
}: {
  appName: string;
  onActiveWorkspaceTabChange: React.ComponentProps<
    typeof WorkspacesPlugin
  >['onActiveWorkspaceTabChange'];
}): React.ReactElement {
  const { getConnectionById } = useConnectionsListRef();

  const onWorkspaceTabChange = useCallback(
    (ws: WorkspaceTab | null, collectionInfo: CollectionTabInfo | null) => {
      onActiveWorkspaceTabChange(ws, collectionInfo);

      const namespace = ws && 'namespace' in ws ? ws.namespace : undefined;
      const connectionInfo =
        ws && 'connectionId' in ws
          ? getConnectionById(ws.connectionId)?.info
          : undefined;
      updateTitle(
        appName,
        connectionInfo ? getConnectionTitle(connectionInfo) : undefined,
        ws?.type,
        namespace
      );
    },
    [appName, getConnectionById, onActiveWorkspaceTabChange]
  );

  return (
    <WorkspacesProvider
      value={[
        WelcomeWorkspace,
        MyQueriesWorkspace,
        ShellWorkspace,
        PerformanceWorkspace,
        DatabasesWorkspaceTab,
        CollectionsWorkspaceTab,
        CollectionWorkspace,
        DataModelingWorkspaceTab,
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
          CompassGlobalWritesPlugin,
        ]}
        modals={[
          ExplainPlanCollectionTabModal,
          ExportToLanguageCollectionTabModal,
        ]}
      >
        <WorkspacesPlugin
          initialWorkspaceTabs={[{ type: 'Welcome' }]}
          onActiveWorkspaceTabChange={onWorkspaceTabChange}
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
  );
}
