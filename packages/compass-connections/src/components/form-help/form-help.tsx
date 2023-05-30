import React, { useState } from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Subtitle,
  Body,
  Link,
  spacing,
  palette,
  css,
  cx,
  useDarkMode,
  useGuideCue,
} from '@mongodb-js/compass-components';

import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
const { track } = createLoggerAndTelemetry('COMPASS-CONNECT-UI');

const formHelpContainerStyles = css({
  position: 'relative',
  margin: 0,
  width: spacing[5] * 10,
  display: 'inline-block',
});

const sectionContainerStyles = css({
  margin: 0,
  padding: spacing[4],
  paddingBottom: 0,
});

const atlasContainerStyles = css({
  backgroundColor: palette.green.light3,
  paddingBottom: spacing[4],
});

const atlasContainerDarkModeStyles = css({
  backgroundColor: palette.green.dark3,
});

const titleStyles = css({
  fontSize: '14px',
});

const descriptionStyles = css({
  marginTop: spacing[2],
});

const createClusterContainerStyles = css({
  marginTop: spacing[2],
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

function AtlasHelpSection() {
  const darkMode = useDarkMode();
  const intersectingRef = React.useRef<HTMLDivElement | null>(null);
  const { refEl: newToCompassRef } = useGuideCue({
    id: 'new-to-compass',
    group: 'Connection Help',
    title: 'New to Compass',
    content: <p>New to Compass?</p>,
    intersectingRef,
  });

  const { refEl: clusterButtonRef } = useGuideCue({
    id: 'create-cluster',
    group: 'Connection Help',
    title: 'Create a cluster',
    content: <p>Don't have a cluster?</p>,
    intersectingRef,
  });

  return (
    <div
      className={cx(
        sectionContainerStyles,
        atlasContainerStyles,
        darkMode && atlasContainerDarkModeStyles
      )}
      ref={intersectingRef}
    >
      <div ref={newToCompassRef}>
        <Subtitle className={titleStyles}>
          New to Compass and don&apos;t have a cluster?
        </Subtitle>
      </div>
      <Body className={descriptionStyles}>
        If you don&apos;t already have a cluster, you can create one for free
        using{' '}
        <Link href="https://www.mongodb.com/cloud/atlas" target="_blank">
          MongoDB Atlas
        </Link>
      </Body>
      <div className={createClusterContainerStyles}>
        <Button
          ref={clusterButtonRef}
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

function FormHelp(): React.ReactElement {
  const [isAtlasHelpVisible, setIsAtlasHelpVisible] = useState(false);
  const intersectingRef = React.useRef<HTMLDivElement | null>(null);
  const { refEl: connectionStringRef } = useGuideCue({
    id: 'find-cs',
    group: 'Connection Help',
    title: 'Find Connection String',
    content: <p>Its awesome?</p>,
    intersectingRef,
  });

  const { refEl: exampleRef } = useGuideCue({
    id: 'example-cs',
    group: 'Connection Help',
    title: 'Example Connection String',
    content: <p>Its awesome, ain't it?</p>,
    intersectingRef,
  });

  return (
    <div ref={intersectingRef} className={formHelpContainerStyles}>
      <Button onClick={() => setIsAtlasHelpVisible(true)}>Enable Help</Button>
      {isAtlasHelpVisible && <AtlasHelpSection />}
      <div className={sectionContainerStyles}>
        <Subtitle className={titleStyles}>
          How do I find my connection string in Atlas?
        </Subtitle>
        <Body className={descriptionStyles}>
          If you have an Atlas cluster, go to the Cluster view. Click the
          &apos;Connect&apos; button for the cluster to which you wish to
          connect.
        </Body>
        <div ref={connectionStringRef}>
          <Link
            href="https://docs.atlas.mongodb.com/compass-connection/"
            target="_blank"
          >
            See example
          </Link>
        </div>
      </div>
      <div className={sectionContainerStyles}>
        <Subtitle className={titleStyles}>
          How do I format my connection string?
        </Subtitle>
        <div ref={exampleRef}>
          <Link
            href="https://docs.mongodb.com/manual/reference/connection-string/"
            target="_blank"
          >
            See example
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FormHelp;
