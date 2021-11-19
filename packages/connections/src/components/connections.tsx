import { css } from '@emotion/css';
import React from 'react';
import {
  MongoDBLogo,
  breakpoints,
  compassUIColors,
  spacing,
} from '@mongodb-js/compass-components';
import ConnectForm from '@mongodb-js/connect-form';
import {
  ConnectionInfo,
  ConnectionStorage,
  DataService,
} from 'mongodb-data-service';

import ResizableSidebar from './resizeable-sidebar';
import FormHelp from './form-help/form-help';
import Connecting from './connecting/connecting';
import { ConnectionStore, useConnections } from '../stores/connections-store';

const connectStyles = css({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  top: 0,
  display: 'flex',
  flexDirection: 'row',
  background: compassUIColors.gray8,
});

const logoStyles = css({
  margin: spacing[5],
  marginBottom: 0,
});

const connectItemContainerStyles = css({
  position: 'relative',
  flexGrow: 1,
  flexDirection: 'column',
  overflow: 'auto',
});

const formContainerStyles = css({
  position: 'relative',
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: 0,
  paddingBottom: spacing[4],
  [`@media only screen and (min-width: ${breakpoints.Desktop}px)`]: {
    flexDirection: 'row',
  },
});

function Connections({
  onConnected,
  connectionStorage = new ConnectionStorage(),
}: {
  onConnected: (
    connectionInfo: ConnectionInfo,
    dataService: DataService
  ) => Promise<void>;
  connectionStorage?: ConnectionStore;
}): React.ReactElement {
  const [
    {
      activeConnectionId,
      activeConnectionInfo,
      connectingStatusText,
      connectionAttempt,
      connections,
      isConnected,
    },
    {
      cancelConnectionAttempt,
      connect,
      createNewConnection,
      setActiveConnectionById,
    },
  ] = useConnections(onConnected, connectionStorage);

  return (
    <div
      data-testid={
        isConnected ? 'connections-connected' : 'connections-disconnected'
      }
      className={connectStyles}
    >
      <ResizableSidebar
        activeConnectionId={activeConnectionId}
        connections={connections}
        createNewConnection={createNewConnection}
        setActiveConnectionId={setActiveConnectionById}
      />
      <div className={connectItemContainerStyles}>
        <MongoDBLogo className={logoStyles} color={'green-dark-2'} />
        <div className={formContainerStyles}>
          <ConnectForm
            onConnectClicked={(connectionInfo) => connect(connectionInfo)}
            initialConnectionOptions={activeConnectionInfo.connectionOptions}
            key={activeConnectionId}
          />
          <FormHelp />
        </div>
      </div>
      {!!connectionAttempt && !connectionAttempt.isClosed() && (
        <Connecting
          connectingStatusText={connectingStatusText}
          onCancelConnectionClicked={cancelConnectionAttempt}
        />
      )}
    </div>
  );
}

export default Connections;
