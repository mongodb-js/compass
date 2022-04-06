import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { SaveConnectionModal } from '@mongodb-js/connection-form';

import SidebarInstanceStats from '../sidebar-instance-stats';
import SidebarInstanceDetails from '../sidebar-instance-details';
import NonGenuineWarningPill from '../non-genuine-warning-pill';
import FavoriteButton from '../favorite-button';
import CSFLEMarker from '../csfle-marker';

import styles from './sidebar-instance.module.less';
import { cloneDeep } from 'lodash';

export const SidebarInstance = ({
  instance,
  databases,
  isExpanded,
  isGenuineMongoDB,
  toggleIsDetailsExpanded,
  globalAppRegistryEmit,
  detailsPlugins,
  connectionInfo,
  updateConnectionInfo
}) => {
  const [ isFavoriteModalVisible, setIsFavoriteModalVisible ] = useState(false);

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
        isCSFLEConnection={instance?.isCSFLEConnection}
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
        detailsPlugins={detailsPlugins}
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
  detailsPlugins: PropTypes.array.isRequired,
  connectionInfo: PropTypes.object.isRequired,
  updateConnectionInfo: PropTypes.func.isRequired
};

export default SidebarInstance;
