import React from 'react';
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
} from '@mongodb-js/compass-components';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';

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

export function AtlasHelpSection(): React.ReactElement {
  const track = useTelemetry();
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
