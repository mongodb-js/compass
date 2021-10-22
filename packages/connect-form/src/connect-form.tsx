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

const logoStyles = css({
  position: 'absolute',
  top: spacing[5],
  left: spacing[5],
});

const formCardStyles = css({
  margin: spacing[4],
  marginTop: 99,
  height: 'fit-content',
  width: '100%',
  minWidth: 360,
  maxWidth: 800,
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
  openLink,
}: {
  initialConnectionInfo: ConnectionInfo;
  onConnectClicked: (connectionInfo: ConnectionInfo) => void;
  openLink: (url: string) => void;
}): React.ReactElement {
  const [connectionString, setConnectionString] = useState(
    initialConnectionInfo.connectionOptions.connectionString
  );

  return (
    <React.Fragment>
      <MongoDBLogo css={logoStyles} color={'black'} />
      <Card css={formCardStyles}>
        <div css={formContentContainerStyles}>
          <H3>New Connection</H3>
          <Description css={descriptionStyles}>
            Connect to a MongoDB deployment
          </Description>
          <ConnectionStringInput
            connectionString={connectionString}
            openLink={openLink}
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
    </React.Fragment>
  );
}

export default ConnectForm;
