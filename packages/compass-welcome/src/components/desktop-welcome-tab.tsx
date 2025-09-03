import React from 'react';

import {
  Button,
  ButtonSize,
  ButtonVariant,
  Subtitle,
  H3,
  Body,
  Link,
  spacing,
  palette,
  css,
  cx,
  useDarkMode,
  Icon,
  SpinLoader,
} from '@mongodb-js/compass-components';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import {
  useConnectionActions,
  useConnectionIds,
  useConnectionInfoForId,
  useConnectionForId,
  useConnectionConnectingSteps,
} from '@mongodb-js/compass-connections/provider';
import { usePreference } from 'compass-preferences-model/provider';
import { WelcomeTabImage } from './welcome-image';

const sectionContainerStyles = css({
  margin: 0,
  padding: spacing[600],
  paddingBottom: 0,
  maxWidth: '450px',
  borderRadius: spacing[200],
});

const atlasContainerStyles = css({
  backgroundColor: palette.green.light3,
  border: `1px solid ${palette.green.light2}`,
  paddingBottom: spacing[600],
});

const atlasContainerDarkModeStyles = css({
  backgroundColor: palette.green.dark3,
  borderColor: palette.green.dark2,
});

const titleStyles = css({
  fontSize: '14px',
});

const descriptionStyles = css({
  marginTop: spacing[200],
});

const createClusterContainerStyles = css({
  marginTop: spacing[200],
});

const createClusterButtonStyles = css({
  fontWeight: 'bold',
});

const createClusterButtonLightModeStyles = css({
  background: palette.white,
  '&:hover': {
    background: palette.white,
  },
  '&:focus': {
    background: palette.white,
  },
});

function AtlasHelpSection(): React.ReactElement {
  const track = useTelemetry();
  const darkMode = useDarkMode();

  return (
    <div
      className={cx(
        sectionContainerStyles,
        atlasContainerStyles,
        darkMode && atlasContainerDarkModeStyles
      )}
      data-testid="welcome-tab-atlas-help-section"
    >
      <Subtitle className={titleStyles}>
        New to Compass and don&apos;t have a cluster?
      </Subtitle>
      <Body className={descriptionStyles}>
        If you don&apos;t already have a cluster, you can create one for free
        using{' '}
        <Link href="https://www.mongodb.com/atlas/database" target="_blank">
          MongoDB Atlas
        </Link>
      </Body>
      <div className={createClusterContainerStyles}>
        <Button
          data-testid="atlas-cta-link"
          className={cx(
            createClusterButtonStyles,
            !darkMode && createClusterButtonLightModeStyles
          )}
          onClick={() => track('Atlas Link Clicked', { screen: 'connect' })}
          variant={ButtonVariant.PrimaryOutline}
          href="https://www.mongodb.com/cloud/atlas/lp/try4?utm_source=compass&utm_medium=product&utm_content=v1"
          target="_blank"
          size={ButtonSize.Small}
        >
          CREATE FREE CLUSTER
        </Button>
      </div>
    </div>
  );
}

const welcomeTabStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto',
  gap: spacing[200],
});

const firstConnectionBtnStyles = css({
  margin: `${spacing[400]}px 0`,
});

const connectionListStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[300],
  alignItems: 'flex-start',
  width: '100%',
  marginTop: spacing[400],
});

const connectingConnectionItemStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
  fontSize: '14px',
});

const connectedConnectionItemStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
  fontSize: '14px',
});

const greenIconStyles = css({
  color: palette.green.base,
});

const subItemStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
  fontSize: '12px',
  marginLeft: spacing[400],
  paddingTop: spacing[100],
  paddingBottom: spacing[100],
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
        key: 'auth',
        label: 'Authenticating...',
        completed: connectingSteps.authenticated,
      },
      {
        key: 'metadata',
        label: 'Getting Metadata...',
        completed: connectingSteps.metadataReceived,
      },
    ];

    return steps.map((step) => (
      <div key={step.key} className={subItemStyles}>
        {step.completed ? (
          <Icon glyph="Checkmark" size="small" className={greenIconStyles} />
        ) : (
          <SpinLoader size={10} />
        )}
        <span>{step.label}</span>
      </div>
    ));
  };

  return (
    <div>
      <div
        className={
          isConnected
            ? connectedConnectionItemStyles
            : connectingConnectionItemStyles
        }
        style={statusColor ? { color: statusColor } : {}}
      >
        {icon}
        <span>{statusText}</span>
      </div>
      {renderConnectingSteps()}
    </div>
  );
}

export default function DesktopWelcomeTab() {
  const { createNewConnection } = useConnectionActions();
  const enableCreatingNewConnections = usePreference(
    'enableCreatingNewConnections'
  );

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

  // Get IDs of connections in initial state (e.g., when connection form is open)
  const initialConnectionIds = useConnectionIds(
    (connection) => connection.status === 'initial'
  );

  // Show connections if any connection is connecting, connected, failed, or in initial state
  const hasConnectionActivity =
    connectingConnectionIds.length > 0 ||
    connectedConnectionIds.length > 0 ||
    failedConnectionIds.length > 0 ||
    initialConnectionIds.length > 0;

  return (
    <div className={welcomeTabStyles}>
      <WelcomeTabImage />
      <div>
        <H3>Welcome to MongoDB Compass</H3>
        {enableCreatingNewConnections && !hasConnectionActivity && (
          <>
            <Body>To get started, connect to an existing server or</Body>
            <Button
              className={firstConnectionBtnStyles}
              data-testid="add-new-connection-button"
              variant={ButtonVariant.Primary}
              leftGlyph={<Icon glyph="Plus" />}
              onClick={createNewConnection}
            >
              Add new connection
            </Button>
            <AtlasHelpSection />
          </>
        )}
        {hasConnectionActivity && (
          <div className={connectionListStyles}>
            {initialConnectionIds.map((connectionId) => (
              <ConnectionStatus
                key={connectionId}
                connectionId={connectionId}
              />
            ))}
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
        )}
      </div>
    </div>
  );
}
