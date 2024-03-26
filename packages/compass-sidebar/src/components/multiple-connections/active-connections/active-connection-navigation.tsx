import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import {
  type Actions,
  ConnectionsNavigationTree,
} from '@mongodb-js/compass-connections-navigation';
import { useActiveConnections } from '@mongodb-js/compass-connections/provider';
import {
  type ConnectionInfo,
  getConnectionTitle,
} from '@mongodb-js/connection-info';
import toNS from 'mongodb-ns';
import {
  type Database,
  toggleDatabaseExpanded,
} from '../../../modules/databases';
import type { RootState, SidebarThunkAction } from '../../../modules';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import {
  Subtitle,
  css,
  palette,
  spacing,
} from '@mongodb-js/compass-components';

function findCollection(ns: string, databases: Database[]) {
  const { database, collection } = toNS(ns);

  return (
    databases
      .find((db) => db._id === database)
      ?.collections.find((coll) => coll.name === collection) ?? null
  );
}

const activeConnectionsContainerStyles = css({
  height: '100%',
  padding: `${spacing[2]}px ${spacing[3]}px`,
  borderTop: `1px solid ${palette.gray.light2}`,
});

const activeConnectionListHeaderStyles = css({
  flexGrow: 0,
  display: 'flex',
  flexDirection: 'row',
  alignContent: 'center',
  justifyContent: 'space-between',
});

const activeConnectionListHeaderTitleStyles = css({
  marginTop: 0,
  marginBottom: 0,
  textTransform: 'uppercase',
  fontSize: '12px',
});

const activeConnectionCountStyles = css({
  fontWeight: 'normal',
});

function ActiveConnectionNavigation({
  // isDataLake,
  // isWritable,
  expanded,
  activeWorkspace,
  onNamespaceAction: _onNamespaceAction,
  databases,
  ...navigationProps
}: Omit<
  React.ComponentProps<typeof ConnectionsNavigationTree>,
  | 'isReadOnly'
  | 'databases'
  | 'connections'
  | 'expanded'
  | 'onConnectionExpand'
  | 'isReady'
> & {
  databases: Database[];
  isDataLake?: boolean;
  isWritable?: boolean;
  expanded: Record<string, boolean>;
  activeWorkspace: { type: string; namespace?: string } | null;
}): React.ReactElement {
  const activeConnections = useActiveConnections();
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [namedConnections, setNamedConnections] = useState<
    { connectionInfo: ConnectionInfo; name: string }[]
  >([]);

  const {
    openDatabasesWorkspace,
    openCollectionsWorkspace,
    openCollectionWorkspace,
    openEditViewWorkspace,
  } = useOpenWorkspace();

  const onConnectionToggle = (namespace: string, forceExpand: boolean) => {
    const connectionId = namespace.split('.')[0];
    if (!forceExpand && !collapsed.includes(connectionId))
      setCollapsed([...collapsed, connectionId]);
    else if (forceExpand && collapsed.includes(connectionId)) {
      const index = collapsed.indexOf(connectionId);
      setCollapsed([
        ...collapsed.slice(0, index),
        ...collapsed.slice(index + 1),
      ]);
    }
  };

  useEffect(() => {
    // cleanup connections that are no longer active
    // if the user connects again, the new connection should be expanded again
    const newCollapsed = activeConnections
      .filter(({ id }: ConnectionInfo) => collapsed.includes(id))
      .map(({ id }: ConnectionInfo) => id);
    setCollapsed(newCollapsed);

    const newConnectionList = activeConnections
      .map((connectionInfo) => ({
        connectionInfo,
        name: getConnectionTitle(connectionInfo),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    setNamedConnections(newConnectionList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConnections]);

  const onNamespaceAction = useCallback(
    (ns: string, action: Actions) => {
      switch (action) {
        case 'select-connection':
          openDatabasesWorkspace(ns);
          return;
        case 'select-database':
          openCollectionsWorkspace(ns);
          return;
        case 'select-collection':
          openCollectionWorkspace(ns);
          return;
        case 'open-in-new-tab':
          openCollectionWorkspace(ns, { newTab: true });
          return;
        case 'modify-view': {
          const coll = findCollection(ns, databases);
          if (coll && coll.sourceName && coll.pipeline) {
            openEditViewWorkspace(coll._id, {
              sourceName: coll.sourceName,
              sourcePipeline: coll.pipeline,
              newTab: true,
            });
          }
          return;
        }
        default:
          _onNamespaceAction(ns, action);
          return;
      }
    },
    [
      databases,
      openDatabasesWorkspace,
      openCollectionsWorkspace,
      openCollectionWorkspace,
      openEditViewWorkspace,
      _onNamespaceAction,
    ]
  );

  return (
    <div className={activeConnectionsContainerStyles}>
      <header className={activeConnectionListHeaderStyles}>
        <Subtitle className={activeConnectionListHeaderTitleStyles}>
          Active connections{' '}
          <span className={activeConnectionCountStyles}>
            ({activeConnections.length})
          </span>
        </Subtitle>
      </header>
      <ConnectionsNavigationTree
        isReady={true}
        connections={namedConnections.map(({ connectionInfo, name }) => ({
          connectionInfo,
          name,
          databasesStatus: 'ready',
          databasesLength: databases?.length,
          databases,
        }))}
        activeNamespace={activeWorkspace?.namespace}
        onNamespaceAction={onNamespaceAction}
        onConnectionExpand={onConnectionToggle}
        expanded={namedConnections.reduce(
          (obj, { connectionInfo: { id: connectionId } }) => {
            obj[connectionId] = collapsed.includes(connectionId)
              ? false
              : expanded;
            return obj;
          },
          {} as Record<string, false | Record<string, boolean>>
        )}
        {...navigationProps}
      />
    </div>
  );
}

function mapStateToProps(state: RootState) {
  const {
    databases: { filterRegex, filteredDatabases, expandedDbList },
    instance,
  } = state;
  const status = instance?.databasesStatus;
  const isReady =
    status !== undefined && !['initial', 'fetching'].includes(status);
  const defaultExpanded = Boolean(filterRegex);
  const expanded = Object.fromEntries(
    (filteredDatabases as any[]).map(({ name }) => [
      name,
      expandedDbList[name] ?? defaultExpanded,
    ])
  );
  const isDataLake = instance?.dataLake.isDataLake;
  const isWritable = instance?.isWritable;

  return {
    isReady,
    isDataLake,
    isWritable,
    databases: filteredDatabases,
    expanded,
  };
}

const onNamespaceAction = (
  namespace: string,
  action: Actions
): SidebarThunkAction<void> => {
  return (_dispatch, getState, { globalAppRegistry }) => {
    const emit = (action: string, ...rest: any[]) => {
      globalAppRegistry.emit(action, ...rest);
    };
    const ns = toNS(namespace);
    switch (action) {
      case 'drop-database':
        emit('open-drop-database', ns.database);
        return;
      case 'rename-collection':
        emit('open-rename-collection', ns);
        return;
      case 'drop-collection':
        emit('open-drop-collection', ns);
        return;
      case 'create-collection':
        emit('open-create-collection', ns);
        return;
      case 'duplicate-view': {
        const coll = findCollection(namespace, getState().databases.databases);
        if (coll && coll.sourceName) {
          emit('open-create-view', {
            source: coll.sourceName,
            pipeline: coll.pipeline,
            duplicate: true,
          });
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
})(ActiveConnectionNavigation);
