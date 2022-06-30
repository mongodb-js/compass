import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { SaveConnectionModal } from '@mongodb-js/connection-form';

import SidebarInstanceStats from '../sidebar-instance-stats';
import SidebarInstanceDetails from '../sidebar-instance-details';
import NonGenuineWarningPill from '../non-genuine-warning-pill';
import FavoriteButton from '../favorite-button';
import CSFLEMarker from '../csfle-marker';
import CSFLEConnectionModal from '../csfle-connection-modal';

import styles from './sidebar-instance.module.less';
import { cloneDeep } from 'lodash';

export const SidebarInstance = ({
  instance,
  databases,
  isExpanded,
  isGenuineMongoDB,
  toggleIsDetailsExpanded,
  globalAppRegistryEmit,
  connectionInfo,
  updateConnectionInfo,
  setConnectionIsCSFLEEnabled,
  deploymentAwareness,
  serverVersion,
  sshTunnelStatus
}) => {
  const [ isFavoriteModalVisible, setIsFavoriteModalVisible ] = useState(false);
  const [ isCSFLEModalVisible, setIsCSFLEModalVisible ] = useState(false);

  const onClickSaveFavorite = useCallback((newFavoriteInfo) => {
    updateConnectionInfo({
      ...cloneDeep(connectionInfo),
      favorite: newFavoriteInfo
    });

    setIsFavoriteModalVisible(false);
  }, [connectionInfo, updateConnectionInfo, setIsFavoriteModalVisible]);

  return (
    <div className={styles['sidebar-instance']}>
      <SidebarInstanceStats
        instance={instance}
        databases={databases}
        isExpanded={isExpanded}
        toggleIsExpanded={toggleIsDetailsExpanded}
        globalAppRegistryEmit={globalAppRegistryEmit}
      />
      <FavoriteButton
        favoriteOptions={connectionInfo.favorite}
        toggleIsFavoriteModalVisible={() => setIsFavoriteModalVisible(
          !isFavoriteModalVisible
        )}
      />
      <CSFLEMarker
        csfleMode={instance?.csfleMode}
        toggleCSFLEModalVisible={() => setIsCSFLEModalVisible(!isCSFLEModalVisible)}
      />
      <CSFLEConnectionModal
        open={isCSFLEModalVisible}
        setOpen={(open) => setIsCSFLEModalVisible(open)}
        csfleMode={instance?.csfleMode}
        setConnectionIsCSFLEEnabled={setConnectionIsCSFLEEnabled}
      />
      <SaveConnectionModal
        initialFavoriteInfo={connectionInfo.favorite}
        open={isFavoriteModalVisible}
        onCancelClicked={() => setIsFavoriteModalVisible(false)}
        onSaveClicked={(favoriteInfo) => onClickSaveFavorite(favoriteInfo)}
      />
      <NonGenuineWarningPill
        isGenuineMongoDB={isGenuineMongoDB}
      />
      <SidebarInstanceDetails
        deploymentAwareness={deploymentAwareness}
        serverVersion={serverVersion}
        sshTunnelStatus={sshTunnelStatus}
        isExpanded={isExpanded}
      />
    </div>
  );
};

SidebarInstance.displayName = 'SidebarInstance';
SidebarInstance.propTypes = {
  instance: PropTypes.object,
  databases: PropTypes.array,
  isExpanded: PropTypes.bool.isRequired,
  isGenuineMongoDB: PropTypes.bool.isRequired,
  toggleIsDetailsExpanded: PropTypes.func.isRequired,
  globalAppRegistryEmit: PropTypes.func.isRequired,
  deploymentAwareness: PropTypes.object.isRequired,
  serverVersion: PropTypes.object.isRequired,
  sshTunnelStatus: PropTypes.object.isRequired,
  connectionInfo: PropTypes.object.isRequired,
  updateConnectionInfo: PropTypes.func.isRequired,
  setConnectionIsCSFLEEnabled: PropTypes.func.isRequired,
};

export default SidebarInstance;
