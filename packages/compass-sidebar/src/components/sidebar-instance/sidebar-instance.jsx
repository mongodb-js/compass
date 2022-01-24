import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { SaveConnectionModal } from '@mongodb-js/connect-form';

import SidebarInstanceStats from '../sidebar-instance-stats';
import SidebarInstanceDetails from '../sidebar-instance-details';
import NonGenuineWarningPill from '../non-genuine-warning-pill';
import FavoriteButton from '../favorite-button';

import styles from './sidebar-instance.module.less';

export const SidebarInstance = ({
  instance,
  databases,
  isExpanded,
  isGenuineMongoDB,
  toggleIsDetailsExpanded,
  globalAppRegistryEmit,
  detailsPlugins,
  connectionModel,
  saveFavorite
}) => {
  const [ isFavoriteModalVisible, setIsFavoriteModalVisible ] = useState(false);

  /**
  * Saves the current connection to favorites.
  *
  * @param {String} name - The favorite name.
  * @param {String} color - The favorite color.
  */

  // (name, color)
  const onClickSaveFavorite = useCallback((connectionInfo) => {
    console.log('save!', connectionInfo);
    // saveFavorite(connectionModel.connection, name, color);
    setIsFavoriteModalVisible(false);
  }, [connectionModel, saveFavorite, setIsFavoriteModalVisible]);

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
        connectionModel={connectionModel}
        toggleIsFavoriteModalVisible={() => setIsFavoriteModalVisible(
          !isFavoriteModalVisible
        )}
      />
      <SaveConnectionModal
        initialConnectionInfo={{
          id: 123,
          connectionOptions: {
            connectionString: 'mongodb://localhost:27017'
          }
        }}
        open={isFavoriteModalVisible}
        // connectionModel={connectionModel.connection}
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
  connectionModel: PropTypes.object,
  toggleIsModalVisible: PropTypes.func.isRequired,
  isModalVisible: PropTypes.bool.isRequired,
  saveFavorite: PropTypes.func.isRequired
};

export default SidebarInstance;
