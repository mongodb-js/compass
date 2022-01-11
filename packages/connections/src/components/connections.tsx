import { css } from '@emotion/css';
import React from 'react';
import {
  Banner,
  BannerVariant,
  compassUIColors,
  spacing,
} from '@mongodb-js/compass-components';
import ConnectForm from '@mongodb-js/connect-form';
import {
  ConnectionInfo,
  ConnectionOptions,
  ConnectionStorage,
  DataService,
  connect,
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
  padding: spacing[4],
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: spacing[4],
});

function Connections({
  onConnected,
  connectionStorage = new ConnectionStorage(),
  connectFn = connect,
}: {
  onConnected: (
    connectionInfo: ConnectionInfo,
    dataService: DataService
  ) => Promise<void>;
  connectionStorage?: ConnectionStore;
  connectFn?: (connectionOptions: ConnectionOptions) => Promise<DataService>;
}): React.ReactElement {
  const [
    {
      activeConnectionId,
      activeConnectionInfo,
      connectingStatusText,
      connectionAttempt,
      connections,
      isConnected,
      storeConnectionError
    },
    {
      cancelConnectionAttempt,
      connect,
      createNewConnection,
      hideStoreConnectionError,
      setActiveConnectionById,
    },
  ] = useConnections(onConnected, connectionStorage, connectFn);

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
        onConnectionDoubleClicked={connect}
      />
      <div className={connectItemContainerStyles}>
        {storeConnectionError && (
          <Banner
            variant={BannerVariant.Danger}
            dismissible
            onClose={hideStoreConnectionError}
          >
            {storeConnectionError}
          </Banner>
        )}
        <div className={formContainerStyles}>
          <ConnectForm
            onConnectClicked={(connectionInfo) =>
              connect({
                ...connectionInfo,
              })
            }
            initialConnectionInfo={activeConnectionInfo}
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
