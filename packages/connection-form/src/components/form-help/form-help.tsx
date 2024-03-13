import React from 'react';
import {
  Subtitle,
  Body,
  Link,
  spacing,
  css,
  palette,
} from '@mongodb-js/compass-components';

const formHelpContainerStyles = css({
  position: 'relative',
  margin: 0,
  width: spacing[5] * 10,
  display: 'inline-block',
});

const sectionContainerStyles = css({
  backgroundColor: palette.blue.light3,
  margin: 0,
  marginBottom: spacing[3],
  padding: spacing[4],
  paddingTop: spacing[3],
  paddingBottom: spacing[3],
  borderRadius: spacing[2],
  border: `1px solid ${palette.blue.light2}`,
});

const titleStyles = css({
  fontSize: '14px',
});

const descriptionStyles = css({
  marginTop: spacing[2],
});

function FormHelp(): React.ReactElement {
  return (
    <div className={formHelpContainerStyles}>
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
