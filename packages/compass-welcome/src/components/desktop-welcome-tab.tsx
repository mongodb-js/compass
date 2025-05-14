import React from 'react';
import { connect } from 'react-redux';
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
} from '@mongodb-js/compass-components';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import {
  useConnectionActions,
  useConnectionInfoForId,
} from '@mongodb-js/compass-connections/provider';
import { usePreference } from 'compass-preferences-model/provider';
import { WelcomeTabImage } from './welcome-image';
import { useRecentCollections } from '@mongodb-js/compass-workspaces/provider';
import { useConnectionColor } from '@mongodb-js/connection-form';
import { connectToConnectionAndOpenWorkspace } from '../stores/recent-connections';
import CompassLogSummary from './compass-log-summary';

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
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto',
  gap: spacing[200],
});

const mainSectionStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto',
  gap: spacing[200],
});

const firstConnectionBtnStyles = css({
  margin: `${spacing[400]}px 0`,
});

const collectionLinkStyles = css({
  alignItems: 'center',
  gap: spacing[100],
  display: 'inline-flex',
  span: {
    alignItems: 'center',
    gap: spacing[100],
    display: 'inline-flex',
  },
  '&:hover': {
    cursor: 'pointer',
  },
});

const recentCollectionsContainerStyles = css({
  marginTop: spacing[800],
  width: 500,
  marginRight: 150,
});

const recentCollectionsTitleStyles = css({
  marginBottom: spacing[200],
});

const collectionItemStyles = css({
  display: 'flex',
  gap: spacing[300],
  marginBottom: spacing[200],
});

const connectionInfoStyles = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[100],
});

const connecitonInfoIconStyles = css({});

function _RecentConnectionItem({
  connectionId,
  namespace,
  onClickOpenCollectionWorkspace,
}: {
  connectionId: string;
  namespace: string;
  onClickOpenCollectionWorkspace: (opts: {
    namespace: string;
    connectionId: string;
  }) => void;
}) {
  const connectionInfo = useConnectionInfoForId(connectionId);
  const { connectionColorToHexActive } = useConnectionColor();

  if (!connectionInfo) {
    // The connection no longer exists.
    return null;
  }

  return (
    <div className={collectionItemStyles}>
      <Link
        className={collectionLinkStyles}
        as="button"
        onClick={() =>
          onClickOpenCollectionWorkspace({
            namespace,
            connectionId,
          })
        }
      >
        <Icon glyph="Folder" />
        <span>{namespace}</span>
      </Link>
      <Body className={connectionInfoStyles}>
        {connectionInfo.favorite ? (
          <Icon
            className={connecitonInfoIconStyles}
            glyph="Favorite"
            color={connectionColorToHexActive(connectionInfo.favorite.color)}
          />
        ) : null}
        {connectionInfo.title}
      </Body>
    </div>
  );
}

const RecentConnectionItem = connect(null, {
  onClickOpenCollectionWorkspace: connectToConnectionAndOpenWorkspace,
})(_RecentConnectionItem);

export default function DesktopWelcomeTab() {
  const { createNewConnection } = useConnectionActions();
  const enableCreatingNewConnections = usePreference(
    'enableCreatingNewConnections'
  );
  const recentCollections = useRecentCollections();

  return (
    <div className={welcomeTabStyles}>
      <div>
        <CompassLogSummary />
      </div>
      <div className={mainSectionStyles}>
        <WelcomeTabImage />
        <div>
          <H3>Welcome to MongoDB Compass</H3>
          {enableCreatingNewConnections && (
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
        </div>
      </div>
      {recentCollections && (
        <div className={recentCollectionsContainerStyles}>
          <H3 className={recentCollectionsTitleStyles}>Recent</H3>
          {recentCollections.map((recentCollection, index) => (
            <RecentConnectionItem
              key={index}
              connectionId={recentCollection.connectionId}
              namespace={recentCollection.namespace}
            />
          ))}
        </div>
      )}
    </div>
  );
}
