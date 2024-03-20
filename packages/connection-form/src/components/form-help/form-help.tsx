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

const formHelpContainerStyles = css({
  position: 'relative',
  margin: 0,
  width: spacing[5] * 10,
  display: 'inline-block',
});

const sectionContainerStyles = css({
  backgroundColor: 'var(--theme-background-color)',
  margin: 0,
  marginBottom: spacing[3],
  padding: spacing[4],
  paddingTop: spacing[3],
  paddingBottom: spacing[3],
  borderRadius: spacing[2],
  border: `1px solid var(--theme-border-color)`,
});

const titleStyles = css({
  fontSize: '14px',
});

const descriptionStyles = css({
  marginTop: spacing[2],
});

function FormHelp(): React.ReactElement {
  const darkMode = useDarkMode();
  const backgroundColor = darkMode ? palette.blue.dark3 : palette.blue.light3;
  const borderColor = darkMode ? palette.blue.dark2 : palette.blue.light2;

  return (
    <div
      style={{
        '--theme-background-color': backgroundColor,
        '--theme-border-color': borderColor,
      }}
      className={formHelpContainerStyles}
    >
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
