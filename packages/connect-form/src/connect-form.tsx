/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Button, ButtonVariant, Card } from '@mongodb-js/compass-components';

const formCardStyles = css({
  margin: 20,
  marginTop: 99,
  padding: 20,
  height: 'fit-content',
  width: '100%',
  minWidth: 360,
  maxWidth: 800
});

function ConnectForm({
  onConnectClicked
}: {
  onConnectClicked: () => void
}): React.ReactElement {
  return (
    <Card
      css={formCardStyles}
    >
      <h1>Connect form</h1>
      <div>
        <Button
          variant={ButtonVariant.Primary}
          onClick={onConnectClicked}
        >Connect</Button>
      </div>
    </Card>
  );
}

export default ConnectForm;
