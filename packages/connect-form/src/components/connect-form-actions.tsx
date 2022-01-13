import React from 'react';
import {
  Button,
  ButtonVariant,
  spacing,
  uiColors,
  css,
} from '@mongodb-js/compass-components';

const formActionStyles = css({
  padding: spacing[4],
  borderTop: `1px solid ${uiColors.gray.light2}`,
  textAlign: 'right',
});

function ConnectFormActions({
  onConnectClicked,
}: {
  onConnectClicked: () => void;
}): React.ReactElement {
  return (
    <div className={formActionStyles}>
      <Button variant={ButtonVariant.Primary} onClick={onConnectClicked}>
        Connect
      </Button>
    </div>
  );
}

export default ConnectFormActions;
