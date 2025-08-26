import React from 'react';
import {
  Button,
  ButtonVariant,
  H3,
  spacing,
  css,
  Body,
  Link,
  Icon,
  palette,
  SpinLoader,
} from '@mongodb-js/compass-components';
import {
  useConnectionIds,
  useConnectionInfoForId,
} from '@mongodb-js/compass-connections/provider';
import { WelcomeTabImage, ConnectingPlugImage } from './welcome-image';

const welcomeTabStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto',
  gap: spacing[200],
});

const contentBodyStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
  alignItems: 'flex-start',
});

const containerStyles = css({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  margin: '0 auto',
  minHeight: '100vh',
  paddingTop: spacing[800], // Move content up with top padding
});

const connectingLayoutStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[300], // Reduce gap to compress layout
  textAlign: 'center',
  maxWidth: '600px',
  width: '100%',
});

const connectingImageContainerStyles = css({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: spacing[200], // Add margin below image
});

const connectionListStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[300], // Increase gap for better separation of connections
  alignItems: 'center',
  width: '100%',
  marginTop: spacing[400], // Add more space above connection list
});

const connectionItemStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
  fontSize: '14px',
});

const greenIconStyles = css({
  color: palette.green.dark2, // Use darker green
});

const subItemStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
  fontSize: '12px',
  paddingLeft: spacing[600], // Indent for sub-items
  paddingTop: spacing[100], // Add vertical spacing
  paddingBottom: spacing[100],
  color: palette.gray.dark1,
});

function ConnectionStatus({
  connectionId,
  isConnected,
}: {
  connectionId: string;
  isConnected: boolean;
}) {
  const connectionInfo = useConnectionInfoForId(connectionId);

  if (!connectionInfo) {
    return null;
  }

  const connectionName = connectionInfo.favorite?.name || connectionInfo.id;

  return (
    <div>
      <div className={connectionItemStyles}>
        {isConnected ? (
          <Icon glyph="Checkmark" size="small" className={greenIconStyles} />
        ) : (
          <SpinLoader size={12} />
        )}
        <span>
          {isConnected
            ? `Connected to ${connectionName}`
            : `Connecting to ${connectionName}`}
        </span>
      </div>
      {!isConnected && (
        <div>
          <div className={subItemStyles}>
            <SpinLoader size={10} />
            <span>Discovering Topology...</span>
          </div>
          <div className={subItemStyles}>
            <SpinLoader size={10} />
            <span>Authenticating...</span>
          </div>
          <div className={subItemStyles}>
            <SpinLoader size={10} />
            <span>Listing Databases...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WebWelcomeTab() {
  const numConnections = useConnectionIds().length;

  // Get IDs of connections that are currently connecting
  const connectingConnectionIds = useConnectionIds(
    (connection) => connection.status === 'connecting'
  );

  // Get IDs of connections that are connected
  const connectedConnectionIds = useConnectionIds(
    (connection) => connection.status === 'connected'
  );

  // Show connecting layout if any connection is connecting or connected
  const hasConnectingConnections = connectingConnectionIds.length > 0;
  const hasConnectedConnections = connectedConnectionIds.length > 0;

  if (hasConnectingConnections || hasConnectedConnections) {
    return (
      <div className={containerStyles}>
        <div className={connectingLayoutStyles}>
          <div className={connectingImageContainerStyles}>
            <ConnectingPlugImage />
          </div>
          <H3>Connecting to your clusters...</H3>
          <div className={connectionListStyles}>
            {connectingConnectionIds.map((connectionId) => (
              <ConnectionStatus
                key={connectionId}
                connectionId={connectionId}
                isConnected={false}
              />
            ))}
            {connectedConnectionIds.map((connectionId) => (
              <ConnectionStatus
                key={connectionId}
                connectionId={connectionId}
                isConnected={true}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={welcomeTabStyles}>
      <WelcomeTabImage />
      <div>
        <H3>Welcome! Explore your data</H3>
        <div className={contentBodyStyles}>
          <Body>
            {numConnections === 0
              ? 'To get started, create your first MongoDB Cluster.'
              : 'To get started, connect to an existing cluster.'}
          </Body>
          {numConnections === 0 && (
            <>
              <Button
                as={Link}
                data-testid="add-new-atlas-cluster-button"
                variant={ButtonVariant.Primary}
                href={'#/clusters/starterTemplates'}
              >
                Create a Cluster
              </Button>
              <Body>
                Need more help?{' '}
                <Link href="https://www.mongodb.com/docs/atlas/create-connect-deployments/">
                  View documentation
                </Link>
              </Body>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
