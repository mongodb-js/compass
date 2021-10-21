/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import {
  Button,
  ButtonVariant,
  Card,
  H2,
  spacing,
} from '@mongodb-js/compass-components';

const formCardStyles = css({
  margin: spacing[4],
  marginTop: 99,
  padding: spacing[4],
  height: 'fit-content',
  width: '100%',
  minWidth: 360,
  maxWidth: 800,
});

function ConnectForm({
  onConnectClicked,
}: {
  onConnectClicked: () => void;
}): React.ReactElement {
  return (
    <Card css={formCardStyles}>
      <H2>New Connection</H2>
      <div>
        <Button variant={ButtonVariant.Primary} onClick={onConnectClicked}>
          Connect
        </Button>
      </div>
    </Card>
  );
}

export default ConnectForm;
