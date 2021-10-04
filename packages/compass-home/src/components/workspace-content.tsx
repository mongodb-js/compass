import React, { useRef } from 'react';
import { Banner, BannerVariant } from '@mongodb-js/compass-components';
import AppRegistry from 'hadron-app-registry';

import Namespace from '../types/namespace';
import InstanceLoadedStatus from '../constants/instance-loaded-status';
import getRoleOrNull from '../modules/get-role-or-null';

const ERROR_WARNING = 'An error occurred while loading navigation';

const NOT_MASTER_ERROR = 'not master and slaveOk=false';

// We recommend in the connection dialog to switch to these read preferences.
const RECOMMEND_READ_PREF_MSG = `It is recommended to change your read
 preference in the connection dialog to Primary Preferred or Secondary Preferred
 or provide a replica set name for a full topology connection.`;

export default function WorkspaceContent({
  appRegistry,
  instanceLoadingStatus,
  errorLoadingInstanceMessage,
  isDataLake,
  namespace,
}: {
  appRegistry: AppRegistry;
  instanceLoadingStatus: InstanceLoadedStatus;
  errorLoadingInstanceMessage: string | null;
  isDataLake: boolean;
  namespace: Namespace;
}): React.ReactElement | null {
  const collectionRole = useRef(
    getRoleOrNull(appRegistry, 'Collection.Workspace')
  );
  const databaseRole = useRef(getRoleOrNull(appRegistry, 'Database.Workspace'));
  const instanceRole = useRef(getRoleOrNull(appRegistry, 'Instance.Workspace'));

  if (instanceLoadingStatus === InstanceLoadedStatus.ERROR) {
    let message = errorLoadingInstanceMessage || '';
    if (message.includes(NOT_MASTER_ERROR)) {
      message = `'${message}': ${RECOMMEND_READ_PREF_MSG}`;
    }

    return (
      <Banner variant={BannerVariant.Danger}>
        {ERROR_WARNING}: {message}
      </Banner>
    );
  }

  if (instanceLoadingStatus === InstanceLoadedStatus.LOADING) {
    // Currently handled by compass-status.
    return null;
  }

  if (namespace.database === '') {
    // Render databases list & performance tabs.
    if (!instanceRole.current) {
      return null;
    }
    const Instance = instanceRole.current[0]
      .component as React.JSXElementConstructor<{
      isDataLake: boolean;
    }>;
    return <Instance isDataLake={isDataLake} />;
  } else if (namespace.collection === '') {
    if (!databaseRole.current) {
      return null;
    }

    // Render collections table.
    const Database = databaseRole.current[0].component;
    return <Database />;
  }

  if (!collectionRole.current) {
    return null;
  }

  // Render collection workspace.
  const Collection = collectionRole.current[0]
    .component as React.JSXElementConstructor<{
    isDataLake: boolean;
  }>;
  return <Collection isDataLake={isDataLake} />;
}
