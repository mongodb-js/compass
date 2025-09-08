import React from 'react';
import {
  Icon,
  SpinLoader,
  Description,
  spacing,
  css,
  palette,
} from '@mongodb-js/compass-components';
import {
  useConnectionIds,
  useConnectionInfoForId,
  useConnectionForId,
} from '@mongodb-js/compass-connections/provider';

const connectionListStyles = css({
  marginTop: spacing[400],
  listStyle: 'none',
  padding: 0,
});

const connectionItemStyles = css({
  marginBottom: spacing[200],
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
});

interface ConnectionStatusProps {
  connectionId: string;
}

function ConnectionStatus({ connectionId }: ConnectionStatusProps) {
  const connectionInfo = useConnectionInfoForId(connectionId);
  const connection = useConnectionForId(connectionId);

  if (!connectionInfo || !connection) {
    return null;
  }

  const connectionName = connectionInfo.title;
  const status = connection.status;

  const { icon, statusText } =
    status === 'connected'
      ? {
          icon: (
            <Icon glyph="Checkmark" size="small" color={palette.green.dark2} />
          ),
          statusText: `Connected to ${connectionName}`,
        }
      : status === 'failed'
      ? {
          icon: <Icon glyph="X" size="small" color={palette.red.base} />,
          statusText: `Failed to connect to ${connectionName}`,
        }
      : {
          icon: <SpinLoader size={16} />,
          statusText: `Connecting to ${connectionName}`,
        };

  return (
    <li className={connectionItemStyles}>
      {icon}
      <Description>{statusText}</Description>
    </li>
  );
}

export default function ConnectionList() {
  const activeConnectionIds = useConnectionIds(
    (connection) =>
      connection.status === 'connecting' ||
      connection.status === 'connected' ||
      connection.status === 'failed'
  );

  if (activeConnectionIds.length === 0) {
    return null;
  }

  return (
    <ul className={connectionListStyles}>
      {activeConnectionIds.map((connectionId) => (
        <ConnectionStatus key={connectionId} connectionId={connectionId} />
      ))}
    </ul>
  );
}
