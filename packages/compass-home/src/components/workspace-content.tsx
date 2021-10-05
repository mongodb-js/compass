import React from 'react';
import { Banner, BannerVariant } from '@mongodb-js/compass-components';

import Namespace from '../types/namespace';
import InstanceLoadedStatus from '../constants/instance-loaded-status';
import {
  AppRegistryRoles,
  useAppRegistryRole,
} from '../contexts/app-registry-context';

const ERROR_WARNING = 'An error occurred while loading navigation';

const NOT_MASTER_ERROR = 'not master and slaveOk=false';

// We recommend in the connection dialog to switch to these read preferences.
const RECOMMEND_READ_PREF_MSG = `It is recommended to change your read
 preference in the connection dialog to Primary Preferred or Secondary Preferred
 or provide a replica set name for a full topology connection.`;

export default function WorkspaceContent({
  instanceLoadingStatus,
  errorLoadingInstanceMessage,
  isDataLake,
  namespace,
}: {
  instanceLoadingStatus: InstanceLoadedStatus;
  errorLoadingInstanceMessage: string | null;
  isDataLake: boolean;
  namespace: Namespace;
}): React.ReactElement | null {
  const collectionRole = useAppRegistryRole(
    AppRegistryRoles.COLLECTION_WORKSPACE
  );
  const databaseRole = useAppRegistryRole(AppRegistryRoles.DATABASE_WORKSPACE);
  const instanceRole = useAppRegistryRole(AppRegistryRoles.INSTANCE_WORKSPACE);

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
    if (!instanceRole) {
      return null;
    }
    const Instance = instanceRole[0].component;
    return <Instance isDataLake={isDataLake} />;
  } else if (namespace.collection === '') {
    // Render collections table.
    if (!databaseRole) {
      return null;
    }
    const Database = databaseRole[0].component;
    return <Database />;
  }

  // Render collection workspace.
  if (!collectionRole) {
    return null;
  }
  const Collection = collectionRole[0].component;
  return <Collection isDataLake={isDataLake} />;
}
