import { css } from '@emotion/css';
import React from 'react';
import {
  Button,
  ButtonVariant,
  spacing,
  uiColors,
} from '@mongodb-js/compass-components';

import { useConnectionStringContext } from '../contexts/connection-string-context';

const formActionStyles = css({
  padding: spacing[4],
  borderTop: `1px solid ${uiColors.gray.light2}`,
  textAlign: 'right',
});

function ConnectFormActions({
  onConnectClicked,
}: {
  onConnectClicked: (connectionString: string) => void;
}): React.ReactElement {
  const [connectionStringUrl] = useConnectionStringContext();

  return (
    <div className={formActionStyles}>
      <Button
        variant={ButtonVariant.Primary}
        onClick={() => onConnectClicked(connectionStringUrl.toString())}
      >
        Connect
      </Button>
    </div>
  );
}

export default ConnectFormActions;
