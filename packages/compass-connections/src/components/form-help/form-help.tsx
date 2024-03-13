import React from 'react';
import {
  Subtitle,
  Body,
  Link,
  spacing,
  css,
} from '@mongodb-js/compass-components';
import { AtlasHelpSection } from '../atlas-help/atlas-help';

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

const titleStyles = css({
  fontSize: '14px',
});

const descriptionStyles = css({
  marginTop: spacing[2],
});

function FormHelp({
  isMultiConnectionEnabled,
}: {
  isMultiConnectionEnabled: boolean;
}): React.ReactElement {
  return (
    <div className={formHelpContainerStyles}>
      <AtlasHelpSection />
      {!isMultiConnectionEnabled && (
        <>
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
        </>
      )}
    </div>
  );
}

export default FormHelp;
