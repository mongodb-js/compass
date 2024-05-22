import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { ConnectionsNavigationTree } from '@mongodb-js/compass-connections-navigation';
import type {
  Actions,
  Connection,
} from '@mongodb-js/compass-connections-navigation';
import toNS from 'mongodb-ns';
import { type Database, toggleDatabaseExpanded } from '../../modules/databases';
import { usePreference } from 'compass-preferences-model/provider';
import type { RootState, SidebarThunkAction } from '../../modules';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { findCollection } from '../../helpers/find-collection';

type ExpandedDatabases = Record<
  Database['_id'],
  'expanded' | 'tempExpanded' | undefined
>;

interface Match {
  isMatch?: boolean;
}

type Collection = Database['collections'][number];

type FilteredCollection = Collection & Match;
type FilteredDatabase = Omit<Database, 'collections'> &
  Match & {
    collections: FilteredCollection[];
  };

const filterDatabases = (
  databases: Database[],
  regex: RegExp
): FilteredDatabase[] => {
  const results: FilteredDatabase[] = [];
  for (const db of databases) {
    const isMatch = regex.test(db.name);
    const childMatches = filterCollections(db.collections, regex);

    if (isMatch || childMatches.length) {
      results.push({
        ...db,
        isMatch,
        collections: childMatches.length ? childMatches : db.collections,
        // collections: (!isMatch && childMatches.length) ? childMatches : db.collections, // TODO: check with Ben
      });
    }
  }
  return results;
};

const filterCollections = (
  collections: Collection[],
  regex: RegExp
): FilteredCollection[] => {
  return collections
    .filter(({ name }) => regex.test(name))
    .map((collection) => ({ ...collection, isMatch: true }));
};

/**
 * Take the starting expandedDatabase, and add 'tempExpanded' to collapsed items that:
 * - are included in the filterResults
 * - they either are a direct match, or their children are a direct match
 */
const applyTempExpanded = (
  expandedDatabases: ExpandedDatabases,
  filterResults: FilteredDatabase[]
): ExpandedDatabases => {
  const newExpanded = { ...expandedDatabases };

  filterResults.forEach(({ _id: databaseId, isMatch, collections }) => {
    const childrenCollsAreMatch = collections.length && collections[0].isMatch;
    if ((isMatch || childrenCollsAreMatch) && !newExpanded[databaseId]) {
      newExpanded[databaseId] = 'tempExpanded';
    }
  });
  return newExpanded;
};

/**
 * Reverts 'applyTempExpanded', bringing the items back to collapsed state
 */
const clearTempExpanded = (
  expandedDatabases: ExpandedDatabases
): ExpandedDatabases => {
  const cleared: ExpandedDatabases = Object.fromEntries(
    Object.entries(expandedDatabases || []).map(([dbId, dbState]) => [
      dbId,
      dbState === 'tempExpanded' ? undefined : dbState,
    ])
  );
  return cleared;
};

function SidebarDatabasesNavigation({
  connections,
  onNamespaceAction: _onNamespaceAction,
  onDatabaseExpand,
  activeWorkspace,
  filterRegex,
  ...dbNavigationProps
}: Omit<
  React.ComponentProps<typeof ConnectionsNavigationTree>,
  'isReadOnly' | 'databases'
> & {
  connections: Connection[];
  filterRegex: RegExp | null;
}) {
  const {
    openCollectionsWorkspace,
    openCollectionWorkspace,
    openEditViewWorkspace,
  } = useOpenWorkspace();
  const preferencesReadOnly = usePreference('readOnly');
  const connection = connections[0];
  const connectionId = connection.connectionInfo.id;
  const isReadOnly =
    preferencesReadOnly || connection.isDataLake || !connection.isWritable;

  const [expandedDatabases, setExpandedDatabases] = useState<ExpandedDatabases>(
    {}
  );
  const [filteredDatabases, setFilteredDatabases] = useState<
    Database[] | undefined
  >(undefined);

  const connectionsButOnlyIfFilterIsActive = filteredDatabases && connections;
  const filteredConnections: Connection[] | undefined = useMemo(() => {
    if (filteredDatabases && connectionsButOnlyIfFilterIsActive) {
      return [
        {
          ...connectionsButOnlyIfFilterIsActive[0],
          databases: filteredDatabases,
        },
      ];
    }
  }, [filteredDatabases, connectionsButOnlyIfFilterIsActive]);

  const expandedMemo: Record<string, Record<string, boolean>> = useMemo(
    () => ({
      [connectionId]: Object.fromEntries(
        Object.entries(expandedDatabases || {}).map(([dbId, dbState]) => [
          dbId,
          !!dbState,
        ])
      ),
    }),
    [expandedDatabases, connectionId]
  );

  const temporarilyExpand = useCallback(
    (filterResults: FilteredDatabase[]) => {
      setExpandedDatabases((expandedDatabases: ExpandedDatabases) => {
        const expandedStart = clearTempExpanded(expandedDatabases);
        return applyTempExpanded(expandedStart, filterResults);
      });
    },
    [setExpandedDatabases]
  );

  const collapseAllTemporarilyExpanded = useCallback(() => {
    setExpandedDatabases(clearTempExpanded);
  }, [setExpandedDatabases]);

  // filter updates
  // databases change often, but the effect only uses databases if the filter is active
  // so we use this conditional dependency to avoid too many calls
  const databasesButOnlyIfFilterIsActive =
    filterRegex && connections[0].databases;
  useEffect(() => {
    if (!filterRegex) {
      setFilteredDatabases(undefined);
      collapseAllTemporarilyExpanded();
    } else if (databasesButOnlyIfFilterIsActive) {
      // this check is extra just to please TS
      const results = filterDatabases(
        databasesButOnlyIfFilterIsActive,
        filterRegex
      );
      setFilteredDatabases(results);
      temporarilyExpand(results);
    }
  }, [
    filterRegex,
    databasesButOnlyIfFilterIsActive,
    setFilteredDatabases,
    temporarilyExpand,
    collapseAllTemporarilyExpanded,
  ]);

  const onNamespaceAction = useCallback(
    (connectionId: string, ns: string, action: Actions) => {
      switch (action) {
        case 'select-database':
          openCollectionsWorkspace(connectionId, ns);
          return;
        case 'select-collection':
          openCollectionWorkspace(connectionId, ns);
          return;
        case 'open-in-new-tab':
          openCollectionWorkspace(connectionId, ns, { newTab: true });
          return;
        case 'modify-view': {
          const coll = findCollection(ns, connection.databases || []);

          if (coll && coll.sourceName && coll.pipeline) {
            openEditViewWorkspace(connectionId, coll._id, {
              sourceName: coll.sourceName,
              sourcePipeline: coll.pipeline,
              newTab: true,
            });
          }
          return;
        }
        default:
          _onNamespaceAction(connectionId, ns, action);
          return;
      }
    },
    [
      connection,
      openCollectionsWorkspace,
      openCollectionWorkspace,
      openEditViewWorkspace,
      _onNamespaceAction,
    ]
  );

  // auto-expanding on a workspace change
  useEffect(() => {
    if (
      activeWorkspace &&
      (activeWorkspace.type === 'Collections' ||
        activeWorkspace.type === 'Collection')
    ) {
      const namespace: string = activeWorkspace.namespace;
      onDatabaseExpand(connectionId, namespace, true);
    }
  }, [activeWorkspace, onDatabaseExpand, connectionId]);

  return (
    <ConnectionsNavigationTree
      connections={filteredConnections || connections}
      expanded={expandedMemo}
      {...dbNavigationProps}
      onNamespaceAction={onNamespaceAction}
      onDatabaseExpand={onDatabaseExpand}
      activeWorkspace={activeWorkspace}
      isReadOnly={isReadOnly}
    />
  );
}

function mapStateToProps(
  state: RootState,
  {
    connectionInfo,
  }: { connectionInfo: ConnectionInfo; filterRegex: RegExp | null }
): {
  isReady: boolean;
  connections: Connection[];
} {
  const connectionId = connectionInfo.id;
  const instance = state.instance[connectionId];
  const { databases } = state.databases[connectionId] || {};

  const status = instance?.databasesStatus;
  const isReady =
    status !== undefined && !['initial', 'fetching'].includes(status);

  const isDataLake = instance?.dataLake?.isDataLake ?? false;
  const isWritable = instance?.isWritable ?? false;

  return {
    isReady: true,
    connections: [
      {
        isReady,
        isDataLake,
        isWritable,
        name: '',
        connectionInfo,
        databasesLength: databases.length || 0,
        databasesStatus: (status ??
          'fetching') as Connection['databasesStatus'],
        databases: databases ?? [],
        isPerformanceTabSupported:
          !isDataLake && !!state.isPerformanceTabSupported[connectionId],
      },
    ],
  };
}

const onNamespaceAction = (
  connectionId: ConnectionInfo['id'],
  namespace: string,
  action: Actions
): SidebarThunkAction<void> => {
  return (_dispatch, getState, { globalAppRegistry }) => {
    // TODO: COMPASS-7719 to adapt modals to be multiple connection aware
    const emit = (action: string, ...rest: any[]) => {
      globalAppRegistry.emit(action, ...rest);
    };
    const ns = toNS(namespace);
    switch (action) {
      case 'drop-database':
        emit('open-drop-database', ns.database, { connectionId });
        return;
      case 'rename-collection':
        emit('open-rename-collection', ns, { connectionId });
        return;
      case 'drop-collection':
        emit('open-drop-collection', ns, { connectionId });
        return;
      case 'create-collection':
        emit('open-create-collection', ns, {
          connectionId,
        });
        return;
      case 'duplicate-view': {
        const coll = findCollection(
          namespace,
          getState().databases[connectionId].databases
        );
        if (coll && coll.sourceName) {
          emit(
            'open-create-view',
            {
              source: coll.sourceName,
              pipeline: coll.pipeline,
              duplicate: true,
            },
            {
              connectionId,
            }
          );
        }
        return;
      }
      default:
      // no-op
    }
  };
};

export default connect(mapStateToProps, {
  onDatabaseExpand: toggleDatabaseExpanded,
  onNamespaceAction,
})(SidebarDatabasesNavigation);
