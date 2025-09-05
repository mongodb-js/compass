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
  useConnectionForId,
  useConnectionConnectingSteps,
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
  alignItems: 'flex-start', // Changed from 'center' to 'flex-start' for left alignment
  gap: spacing[300], // Reduce gap to compress layout
  textAlign: 'left', // Changed from 'center' to 'left'
  maxWidth: '600px',
  width: '100%',
});

const connectingImageContainerStyles = css({
  display: 'flex',
  justifyContent: 'flex-start', // Align with the text
  marginBottom: spacing[200], // Add margin below image
  width: 'fit-content', // Only take up as much width as needed
  alignSelf: 'flex-start', // Align to the start of the container
});

const connectingImageStyles = css({
  width: '334px', // Match the exact text width (333.22px rounded up)
  height: 'auto', // Maintain aspect ratio
  maxWidth: '100%', // Ensure it doesn't overflow container
});

const connectingTitleStyles = css({
  width: 'fit-content', // Let the title determine its natural width
  margin: 0, // Remove any default margins
});

const connectionListStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[300], // Increase gap for better separation of connections
  alignItems: 'flex-start', // Changed from 'center' to 'flex-start' for left alignment
  width: '100%',
  marginTop: spacing[400], // Add more space above connection list
});

const connectingConnectionItemStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
  fontSize: '14px',
  color: palette.gray.dark1, // Grayish color for connecting state
});

const connectedConnectionItemStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
  fontSize: '14px',
  color: palette.black, // Black color for connected state
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

function ConnectionStatus({ connectionId }: { connectionId: string }) {
  const connectionInfo = useConnectionInfoForId(connectionId);
  const connection = useConnectionForId(connectionId);
  const connectingSteps = useConnectionConnectingSteps(connectionId);

  if (!connectionInfo || !connection) {
    return null;
  }

  const connectionName = connectionInfo.title;
  const isConnected = connection.status === 'connected';
  const isConnecting = connection.status === 'connecting';
  const isFailed = connection.status === 'failed';

  let icon;
  let statusText;
  let statusColor = undefined;

  if (isConnected) {
    icon = <Icon glyph="Checkmark" size="small" className={greenIconStyles} />;
    statusText = `Connected to ${connectionName}`;
  } else if (isFailed) {
    icon = <Icon glyph="X" size="small" style={{ color: palette.red.base }} />;
    statusText = `Failed to connect to ${connectionName}`;
    statusColor = palette.red.base;
  } else if (isConnecting) {
    icon = <SpinLoader size={12} />;
    statusText = `Connecting to ${connectionName}`;
  } else {
    // Fallback for other states
    icon = <SpinLoader size={12} />;
    statusText = `Connecting to ${connectionName}`;
  }

  // Create sub-items for connecting steps
  const renderConnectingSteps = () => {
    if (!connectingSteps || !isConnecting) return null;

    const steps = [
      {
        key: 'topology',
        label: 'Discovering Topology...',
        completed: connectingSteps.topologyDiscovered,
      },
      {
        key: 'authentication',
        label: 'Authenticating...',
        completed: connectingSteps.authenticated,
      },
      {
        key: 'metadata',
        label: 'Getting Metadata...',
        completed: connectingSteps.metadataReceived,
      },
    ];

    return steps.map(({ key, label, completed }) => {
      return (
        <div key={key} className={subItemStyles}>
          {completed ? (
            <Icon glyph="Checkmark" size="small" className={greenIconStyles} />
          ) : (
            <SpinLoader size={10} />
          )}
          <span
            style={{
              color: completed ? palette.green.dark2 : undefined,
            }}
          >
            {label}
          </span>
        </div>
      );
    });
  };

  return (
    <div>
      <div
        className={
          isConnected
            ? connectedConnectionItemStyles
            : connectingConnectionItemStyles
        }
      >
        {icon}
        <span style={{ color: statusColor }}>{statusText}</span>
      </div>
      {isConnecting && <div>{renderConnectingSteps()}</div>}
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

  // Get IDs of connections that failed
  const failedConnectionIds = useConnectionIds(
    (connection) => connection.status === 'failed'
  );

  // Show connecting layout if any connection is connecting, connected, or failed
  const hasConnectionActivity =
    connectingConnectionIds.length > 0 ||
    connectedConnectionIds.length > 0 ||
    failedConnectionIds.length > 0;

  if (hasConnectionActivity) {
    return (
      <div className={containerStyles}>
        <div className={connectingLayoutStyles}>
          <div className={connectingImageContainerStyles}>
            <div className={connectingImageStyles}>
              <ConnectingPlugImage />
            </div>
          </div>
          <H3 className={connectingTitleStyles}>
            Connecting to your clusters...
          </H3>
          <div className={connectionListStyles}>
            {connectingConnectionIds.map((connectionId) => (
              <ConnectionStatus
                key={connectionId}
                connectionId={connectionId}
              />
            ))}
            {connectedConnectionIds.map((connectionId) => (
              <ConnectionStatus
                key={connectionId}
                connectionId={connectionId}
              />
            ))}
            {failedConnectionIds.map((connectionId) => (
              <ConnectionStatus
                key={connectionId}
                connectionId={connectionId}
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
