import React from 'react';
import {
  Subtitle,
  Body,
  Link,
  spacing,
  css,
  palette,
  useDarkMode,
} from '@mongodb-js/compass-components';

const sectionContainerStyles = css({
  backgroundColor: 'var(--theme-background-color)',
  border: `1px solid var(--theme-border-color)`,
  margin: 0,
  marginBottom: spacing[400],
  marginTop: spacing[400],
  padding: spacing[600],
  paddingTop: spacing[400],
  paddingBottom: spacing[400],
  borderRadius: spacing[200],
});

const titleStyles = css({
  fontSize: '14px',
});

const descriptionStyles = css({
  marginTop: spacing[2],
});

const sectionDarkModeStyles = css({
  '--theme-background-color': palette.gray.dark3,
  '--theme-border-color': palette.gray.dark2,
});

const sectionLightModeStyles = css({
  '--theme-background-color': palette.gray.light3,
  '--theme-border-color': palette.gray.light2,
});

function FormHelp(): React.ReactElement {
  const darkMode = useDarkMode();
  const themeStyles = darkMode ? sectionDarkModeStyles : sectionLightModeStyles;

  return (
    <div className={themeStyles}>
      <div className={sectionContainerStyles}>
        <Subtitle className={titleStyles}>
          How do I find my connection string in Atlas?
        </Subtitle>
        <Body className={descriptionStyles}>
          If you have an Atlas cluster, go to the Cluster view. Click the
          &apos;Connect&apos; button for the cluster to which you wish to
          connect.
        </Body>
        <Link
          href="https://docs.atlas.mongodb.com/compass-connection/"
          target="_blank"
        >
          See example
        </Link>
      </div>
      <div className={sectionContainerStyles}>
        <Subtitle className={titleStyles}>
          How do I format my connection string?
        </Subtitle>
        <Link
          href="https://docs.mongodb.com/manual/reference/connection-string/"
          target="_blank"
        >
          See example
        </Link>
      </div>
    </div>
  );
}

export default FormHelp;
