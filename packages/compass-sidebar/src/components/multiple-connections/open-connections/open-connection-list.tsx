import { Subtitle, css, spacing } from '@mongodb-js/compass-components';
import React, { useEffect, useState } from 'react';
import { useActiveConnections } from '@mongodb-js/compass-connections/provider';
import { OpenConnection } from './open-connection';
import {
  getConnectionTitle,
  type ConnectionInfo,
} from '@mongodb-js/connection-info';

const activeConnectionsContainerStyles = css({
  height: '100%',
  padding: spacing[3],
});

const openConnectionListHeaderStyles = css({
  flexGrow: 0,
  display: 'flex',
  flexDirection: 'row',
  alignContent: 'center',
  justifyContent: 'space-between',
});

const openConnectionListHeaderTitleStyles = css({
  marginTop: 0,
  marginBottom: 0,
  textTransform: 'uppercase',
  fontSize: '12px',
});

const openConnectionCountStyles = css({
  fontWeight: 'normal',
});

const activeConnectionsListStyles = css({
  listStyle: 'none',
  height: '100%',
});

export function OpenConnectionList(): React.ReactElement {
  const activeConnections = useActiveConnections();
  const connectionsCount = activeConnections.length;
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [namedConnections, setNamedConnections] = useState<
    (ConnectionInfo & { title: string })[]
  >([]);

  const onConnectionToggle = (connectionId: string, isExpanded: boolean) => {
    if (!isExpanded && !collapsed.includes(connectionId))
      setCollapsed([...collapsed, connectionId]);
    if (isExpanded && collapsed.includes(connectionId)) {
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
        ...connectionInfo,
        title: getConnectionTitle(connectionInfo),
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
    setNamedConnections(newConnectionList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConnections]);

  return (
    <div className={activeConnectionsContainerStyles}>
      <header className={openConnectionListHeaderStyles}>
        <Subtitle className={openConnectionListHeaderTitleStyles}>
          Active connections{' '}
          <span className={openConnectionCountStyles}>
            ({connectionsCount})
          </span>
        </Subtitle>
      </header>
      <ul className={activeConnectionsListStyles}>
        {namedConnections.map((connection) => (
          <OpenConnection
            key={connection.id}
            connection={connection}
            isExpanded={!collapsed.includes(connection.id)}
            onToggle={(isExpanded: boolean) =>
              onConnectionToggle(connection.id, isExpanded)
            }
          />
        ))}
      </ul>
    </div>
  );
}
