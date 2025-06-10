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
} from '@mongodb-js/compass-components';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { useConnectionActions } from '@mongodb-js/compass-connections/provider';
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

export default function DesktopWelcomeTab() {
  const { createNewConnection } = useConnectionActions();
  const enableCreatingNewConnections = usePreference(
    'enableCreatingNewConnections'
  );

  return (
    <div className={welcomeTabStyles}>
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
  );
}
