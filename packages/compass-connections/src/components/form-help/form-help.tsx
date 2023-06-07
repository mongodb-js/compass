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
  GuideCueGroup,
  GuideCueStep,
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
  return (
    <div
      className={cx(
        sectionContainerStyles,
        atlasContainerStyles,
        darkMode && atlasContainerDarkModeStyles
      )}
    >
      <Subtitle className={titleStyles}>
        New to Compass and don&apos;t have a cluster?
      </Subtitle>
      <Body className={descriptionStyles}>
        If you don&apos;t already have a cluster, you can create one for free
        using{' '}
        <GuideCueStep id="MongoDB Atlas" step={2} title="MongoDB Atlas">
          <Link href="https://www.mongodb.com/cloud/atlas" target="_blank">
            MongoDB Atlas
          </Link>
        </GuideCueStep>
      </Body>
      <div className={createClusterContainerStyles}>
        <GuideCueStep id="Create Atlas" step={1} title="Create free cluster">
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
        </GuideCueStep>
      </div>
    </div>
  );
}

function FormHelp(): React.ReactElement {
  const [isAtlasHelpVisible, setIsAtlasHelpVisible] = useState(false);
  return (
    <div className={formHelpContainerStyles}>
      <Button onClick={() => setIsAtlasHelpVisible(!isAtlasHelpVisible)}>
        Toggle Help
      </Button>
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
        <GuideCueStep
          id="Find string"
          step={4}
          title="See example about finding string"
        >
          <Link
            href="https://docs.atlas.mongodb.com/compass-connection/"
            target="_blank"
          >
            See example
          </Link>
        </GuideCueStep>
      </div>
      <div className={sectionContainerStyles}>
        <Subtitle className={titleStyles}>
          How do I format my connection string?
        </Subtitle>
        <GuideCueStep
          id="Format string"
          step={3}
          title="See example about formatting string"
        >
          <Link
            href="https://docs.mongodb.com/manual/reference/connection-string/"
            target="_blank"
          >
            See example
          </Link>
        </GuideCueStep>
      </div>
    </div>
  );
}

export default () => (
  <GuideCueGroup id="Form Help" steps={4}>
    <FormHelp />
  </GuideCueGroup>
);
