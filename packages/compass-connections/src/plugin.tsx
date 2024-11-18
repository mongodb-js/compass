import React from 'react';
import type {
  ConnectionInfo,
  ConnectionStorage,
} from '@mongodb-js/connection-storage/provider';

import {
  connect as reduxConnect,
  ConnectionActionsProvider,
} from './stores/store-context';

import ConnectionModal from './components/connection-modal';

import type { ExtraConnectionData as ExtraConnectionDataForTelemetry } from '@mongodb-js/compass-telemetry';
import { useConnectionFormPreferences } from './hooks/use-connection-form-preferences';

import type { connect as devtoolsConnect } from 'mongodb-data-service';
import type { ConnectionId } from './stores/connections-store-redux';

const ConnectionsComponent: React.FunctionComponent<{
  appName: string;
  onExtraConnectionDataRequest: (
    connectionInfo: ConnectionInfo
  ) => Promise<[ExtraConnectionDataForTelemetry, string | null]>;
  onAutoconnectInfoRequest?: (
    connectionStorage: ConnectionStorage
  ) => Promise<ConnectionInfo | undefined>;
  connectFn?: typeof devtoolsConnect | undefined;
  preloadStorageConnectionInfos?: ConnectionInfo[];
  editingConnectionInfoId?: ConnectionId;
}> = ({ editingConnectionInfoId, children }) => {
  console.log({ editingConnectionInfoId });
  const formPreferences = useConnectionFormPreferences();
  return (
    <ConnectionActionsProvider>
      {children}
      {editingConnectionInfoId && <ConnectionModal {...formPreferences} />}
    </ConnectionActionsProvider>
  );
};

function mapState({
  editingConnectionInfoId,
}: {
  editingConnectionInfoId?: ConnectionId;
}) {
  return { editingConnectionInfoId };
}

export default reduxConnect(mapState)(ConnectionsComponent);
