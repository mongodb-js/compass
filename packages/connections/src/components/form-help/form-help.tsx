/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import {
  Button,
  ButtonVariant,
  Subtitle,
  Description,
  Link,
  spacing,
  uiColors,
  ButtonSize,
} from '@mongodb-js/compass-components';

const formHelpContainerStyles = css({
  position: 'relative',
  margin: spacing[4],
  // marginTop: spacing[7],
  // verticalAlign: 'top',
  minWidth: 200,
  maxWidth: 400,
  display: 'inline-block'
});

const atlasContainerStyles = css({
  backgroundColor: uiColors.green.light3,
  padding: spacing[4],
});

const sectionContainerStyles = css({
  padding: spacing[4],
});

const titleStyles = css({
  fontWeight: 'bold',
  fontSize: 14,
});

const descriptionStyles = css({
  marginTop: spacing[2],
  fontSize: 14,
});

const createClusterContainerStyles = css({
  marginTop: spacing[2],
});

const createClusterButtonStyles = css({
  fontWeight: 'bold',
  background: 'white',
  '&:hover': {
    background: 'white',
  },
  '&:focus': {
    background: 'white',
  },
});

function FormHelp(): React.ReactElement {
  return (
    <div css={formHelpContainerStyles}>
      <div css={[atlasContainerStyles, sectionContainerStyles]}>
        <Subtitle css={titleStyles}>
          New to Compass and don&apos;t have a cluster?
        </Subtitle>
        <Description css={descriptionStyles}>
          If you don&apos;t already have a cluster, you can create one for free
          using{' '}
          <Link href="https://www.mongodb.com/cloud/atlas" target="_blank">
            MongoDB Atlas
          </Link>
        </Description>
        <div css={createClusterContainerStyles}>
          <Button
            css={createClusterButtonStyles}
            onClick={() => alert('todo: track')}
            variant={ButtonVariant.PrimaryOutline}
            // TODO: Track link
            href="https://www.mongodb.com/cloud/atlas/lp/general/try?utm_source=compass&utm_medium=product"
            target="_blank"
            size={ButtonSize.Small}
          >
            CREATE FREE CLUSTER
          </Button>
        </div>
      </div>
      <div css={sectionContainerStyles}>
        <Subtitle css={titleStyles}>
          How do I find my username and password?
        </Subtitle>
        <Description css={descriptionStyles}>
          If your mongod instance has authentication set up, you&apos;ll need
          the credentials of the MongoDB user that is configured on the project.
        </Description>
      </div>
    </div>
  );
}

export default FormHelp;
