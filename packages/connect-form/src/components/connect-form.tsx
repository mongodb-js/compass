import { css } from '@emotion/css';
import React, { useMemo, useState } from 'react';
import { ConnectionOptions } from 'mongodb-data-service';
import { Card, Description, H3, spacing } from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import ConnectionStringInput from './connection-string-input';
import AdvancedConnectionOptions from './advanced-connection-options';
import ConnectionStringContext from '../contexts/connection-string-context';
import ConnectFormActions from './connect-form-actions';

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

function ConnectForm({
  initialConnectionOptions,
  onConnectClicked,
}: {
  initialConnectionOptions: ConnectionOptions;
  onConnectClicked: (connectionOptions: ConnectionOptions) => void;
}): React.ReactElement {
  // TODO: The initial connection string can be invalid.
  //

  // const connectionStringUrl =
  //   useMemo<ConnectionStringUrl>((): ConnectionStringUrl => {
  //     try {
  //       return new ConnectionStringUrl(
  //         initialConnectionOptions.connectionString
  //       );
  //       //
  //     } catch (error) {
  //       // TODO: Pass default connection string when can't be parsed.

  //       // TODO: This should disable the form?
  //       return new ConnectionStringUrl('');
  //     }
  //   }, [initialConnectionOptions]);

  // initialConnectionOptions.connectionString
  // const connectionStringUrl = useRef(initialConnectionStringUrl);

  // TODO: Which as value? Plain string or typed?
  // Plain for the connection string input to show the error.

  return (
    <ConnectionStringContext.Provider
      value={initialConnectionOptions.connectionString}
    >
      <div className={formContainerStyles}>
        <Card className={formCardStyles}>
          <div className={formContentContainerStyles}>
            <H3>New Connection</H3>
            <Description className={descriptionStyles}>
              Connect to a MongoDB deployment
            </Description>
            <ConnectionStringInput />
            <AdvancedConnectionOptions />
          </div>
          <ConnectFormActions
            onConnectClicked={(connectionString: string) =>
              onConnectClicked({
                ...initialConnectionOptions,
                connectionString,
              })
            }
          />
        </Card>
      </div>
    </ConnectionStringContext.Provider>
  );
}

export default ConnectForm;
