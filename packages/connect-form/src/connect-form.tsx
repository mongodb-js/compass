import { css } from '@emotion/css';
import React, { useState } from 'react';
import { ConnectionInfo } from 'mongodb-data-service';
import {
  Button,
  ButtonVariant,
  Card,
  Description,
  H3,
  spacing,
  uiColors,
} from '@mongodb-js/compass-components';

import ConnectionStringInput from './connection-string-input';
import AdvancedConnectionOptions from './advanced-connection-options';

const formContainerStyles = css({
  margin: 0,
  padding: spacing[4],
  height: 'fit-content',
  flexGrow: 1,
  minWidth: 400,
  maxWidth: 760,
  position: 'relative',
  display: 'inline-block',
});

const formCardStyles = css({
  margin: 0,
  padding: spacing[2],
  height: 'fit-content',
  width: '100%',
  position: 'relative',
});

const descriptionStyles = css({
  marginTop: spacing[2],
});

const formContentContainerStyles = css({
  padding: spacing[4],
});

const formActionStyles = css({
  padding: spacing[4],
  borderTop: `1px solid ${uiColors.gray.light2}`,
  textAlign: 'right',
});

function ConnectForm({
  initialConnectionInfo,
  onConnectClicked,
}: {
  initialConnectionInfo: ConnectionInfo;
  onConnectClicked: (connectionInfo: ConnectionInfo) => void;
}): React.ReactElement {
  const [connectionString, setConnectionString] = useState(
    initialConnectionInfo.connectionOptions.connectionString
  );

  return (
    <div className={formContainerStyles}>
      <Card className={formCardStyles}>
        <div className={formContentContainerStyles}>
          <H3>New Connection</H3>
          <Description className={descriptionStyles}>
            Connect to a MongoDB deployment
          </Description>
          <ConnectionStringInput
            connectionString={connectionString}
            setConnectionString={setConnectionString}
          />
          <AdvancedConnectionOptions />
        </div>
        <div className={formActionStyles}>
          <Button
            variant={ButtonVariant.Primary}
            onClick={() =>
              onConnectClicked({
                ...initialConnectionInfo,
                connectionOptions: {
                  ...initialConnectionInfo.connectionOptions,
                  connectionString,
                },
              })
            }
          >
            Connect
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default ConnectForm;
