import {
  IconButton,
  Subtitle,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import React, { useEffect, useState } from 'react';
import { useActiveConnections } from '@mongodb-js/compass-connections/provider';
import { OpenConnection } from './open-connection';
import type { ConnectionInfo } from '@mongodb-js/connection-info';

const openConnectionsContainerStyles = css({
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

export function OpenConnectionList(): React.ReactElement {
  const openConnections = useActiveConnections();
  const connectionsCount = openConnections.length;
  const [collapsed, setCollapsed] = useState<string[]>([]);

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
    const newCollapsed = openConnections
      .filter(({ id }: ConnectionInfo) => collapsed.includes(id))
      .map(({ id }: ConnectionInfo) => id);
    setCollapsed(newCollapsed as string[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openConnections]);

  return (
    <div className={openConnectionsContainerStyles}>
      <header className={openConnectionListHeaderStyles}>
        <Subtitle className={openConnectionListHeaderTitleStyles}>
          Active connections{' '}
          <span className={openConnectionCountStyles}>
            ({connectionsCount})
          </span>
        </Subtitle>
      </header>
      {openConnections.map((connectionInfo: ConnectionInfo) => (
        <OpenConnection
          key={connectionInfo.id}
          connectionInfo={connectionInfo}
          isExpanded={!collapsed.includes(connectionInfo.id)}
          onToggle={(isExpanded: boolean) =>
            onConnectionToggle(connectionInfo.id, isExpanded)
          }
        />
      ))}
    </div>
  );
}
