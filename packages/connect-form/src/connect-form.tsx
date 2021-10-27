/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import React, { useState } from 'react';
import { ConnectionInfo } from 'mongodb-data-service';
import {
  Button,
  ButtonVariant,
  Card,
  Description,
  MongoDBLogo,
  H3,
  spacing,
  uiColors,
} from '@mongodb-js/compass-components';

import ConnectionStringInput from './connection-string-input';

const formContainerStyles = css({
  margin: 0,
  marginTop: 0,
  padding: spacing[4],
  paddingTop: spacing[5],
  height: 'fit-content',
  width: '100%',
  minWidth: 360,
  maxWidth: 800,
  position: 'relative',
  display: 'inline-block'
});

const formCardStyles = css({
  margin: 0,
  marginTop: spacing[6],
  padding: spacing[3],
  height: 'fit-content',
  width: '100%',
  position: 'relative'
});

const logoStyles = css({
  position: 'absolute',
  top: spacing[5],
  left: spacing[5],
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
  openLink: (url: string) => void;
}): React.ReactElement {
  const [connectionString, setConnectionString] = useState(
    initialConnectionInfo.connectionOptions.connectionString
  );

  return (
    <div css={formContainerStyles}>
      <MongoDBLogo css={logoStyles} color={'black'} />
      <Card css={formCardStyles}>
        <div css={formContentContainerStyles}>
          <H3>New Connection</H3>
          <Description css={descriptionStyles}>
            Connect to a MongoDB deployment
          </Description>
          <ConnectionStringInput
            connectionString={connectionString}
            setConnectionString={setConnectionString}
          />
        </div>
        <div css={formActionStyles}>
          <Button
            variant={ButtonVariant.Primary}
            onClick={() =>
              onConnectClicked({
                connectionOptions: {
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
