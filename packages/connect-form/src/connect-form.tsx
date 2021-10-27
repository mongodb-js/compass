/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import {
  Button,
  ButtonVariant,
  Card,
  H2,
  spacing,
} from '@mongodb-js/compass-components';

const formContainerStyles = css({
  margin: 0,
  marginTop: 20,
  padding: spacing[4],
  height: 'fit-content',
  width: '100%',
  minWidth: 360,
  maxWidth: 800,
  position: 'relative'
});

const formCardStyles = css({
  margin: 0,
  padding: spacing[4],
  height: 'fit-content',
  width: '100%',
  minWidth: 360,
  maxWidth: 800,
  position: 'relative'
});

function ConnectForm({
  onConnectClicked,
}: {
  onConnectClicked: () => void;
}): React.ReactElement {
  return (
    <div css={formContainerStyles}>
      <Card css={formCardStyles}>
        <H2>New Connection</H2>
        <div>
          <Button variant={ButtonVariant.Primary} onClick={onConnectClicked}>
            Connect
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default ConnectForm;
