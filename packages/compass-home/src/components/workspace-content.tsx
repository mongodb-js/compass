/* eslint-disable react/prop-types */
import React from 'react';
import { CompassSchemaValidationPlugin } from '@mongodb-js/compass-schema-validation';
import type Namespace from '../types/namespace';
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

const WorkspaceContent: React.FunctionComponent<{ namespace: Namespace }> = ({
  // TODO: clean-up, this state is not needed here anymore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  namespace: _namespace,
}) => {
  return (
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
          CompassSchemaValidationPlugin,
          CompassAggregationsPlugin,
          CompassDocumentsPlugin,
        ]}
      >
        <WorkspacesPlugin
          initialTab={{ type: 'My Queries' }}
        ></WorkspacesPlugin>
      </CollectionTabsProvider>
    </WorkspacesProvider>
  );
};

export default WorkspaceContent;
