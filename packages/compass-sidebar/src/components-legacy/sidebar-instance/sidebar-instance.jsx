import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { SaveConnectionModal } from '@mongodb-js/connection-form';

import { ThemeProvider, Theme } from '@mongodb-js/compass-components';

import SidebarInstanceStats from '../sidebar-instance-stats';
import SidebarInstanceDetails from '../sidebar-instance-details';
import NonGenuineWarningPill from '../non-genuine-warning-pill';
import FavoriteButton from '../favorite-button';
import CSFLEMarker from '../csfle-marker';
import CSFLEConnectionModal from '../csfle-connection-modal';
import NonGenuineWarningModal from '../non-genuine-warning-modal';

import styles from './sidebar-instance.module.less';
import { cloneDeep } from 'lodash';

export const SidebarInstance = ({
  instance,
  databases,
  isExpanded,
  toggleIsDetailsExpanded,
  globalAppRegistryEmit,
  connectionInfo,
  connectionOptions,
  updateConnectionInfo,
  setConnectionIsCSFLEEnabled,
  isGenuineMongoDBVisible,
  toggleIsGenuineMongoDBVisible,
}) => {
  const [isFavoriteModalVisible, setIsFavoriteModalVisible] = useState(false);
  const [isCSFLEModalVisible, setIsCSFLEModalVisible] = useState(false);

  const onClickSaveFavorite = useCallback(
    (newFavoriteInfo) => {
      updateConnectionInfo({
        ...cloneDeep(connectionInfo),
        favorite: newFavoriteInfo,
      });

      setIsFavoriteModalVisible(false);
    },
    [connectionInfo, updateConnectionInfo, setIsFavoriteModalVisible]
  );

  // We have a separate theme provider here because this is still the old
  // sidebar code which has the dark "reversed" theme. And unless we provide the
  // light theme it will inherit the dark theme from the old sidebar for the
  // modals.
  const theme = useState({
    theme:
      process?.env?.COMPASS_LG_DARKMODE === 'true' ? Theme.Dark : Theme.Light,
    enabled: true,
  });

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
        toggleIsFavoriteModalVisible={() =>
          setIsFavoriteModalVisible(!isFavoriteModalVisible)
        }
      />
      <CSFLEMarker
        csfleMode={instance?.csfleMode}
        toggleCSFLEModalVisible={() =>
          setIsCSFLEModalVisible(!isCSFLEModalVisible)
        }
      />
      <NonGenuineWarningPill
        isGenuineMongoDB={instance?.genuineMongoDB.isGenuine}
      />
      <SidebarInstanceDetails
        instance={instance}
        connectionOptions={connectionOptions}
        isExpanded={isExpanded}
      />

      <ThemeProvider theme={theme}>
        <SaveConnectionModal
          initialFavoriteInfo={connectionInfo.favorite}
          open={isFavoriteModalVisible}
          onCancelClicked={() => setIsFavoriteModalVisible(false)}
          onSaveClicked={(favoriteInfo) => onClickSaveFavorite(favoriteInfo)}
        />
        <CSFLEConnectionModal
          open={isCSFLEModalVisible}
          setOpen={(open) => setIsCSFLEModalVisible(open)}
          csfleMode={instance?.csfleMode}
          setConnectionIsCSFLEEnabled={setConnectionIsCSFLEEnabled}
        />
        <NonGenuineWarningModal
          isVisible={isGenuineMongoDBVisible}
          toggleIsVisible={toggleIsGenuineMongoDBVisible}
        />
      </ThemeProvider>
    </div>
  );
};

SidebarInstance.displayName = 'SidebarInstance';
SidebarInstance.propTypes = {
  instance: PropTypes.object.isRequired,
  databases: PropTypes.array,
  isExpanded: PropTypes.bool.isRequired,
  toggleIsDetailsExpanded: PropTypes.func.isRequired,
  globalAppRegistryEmit: PropTypes.func.isRequired,
  connectionInfo: PropTypes.object.isRequired,
  connectionOptions: PropTypes.object.isRequired,
  updateConnectionInfo: PropTypes.func.isRequired,
  setConnectionIsCSFLEEnabled: PropTypes.func.isRequired,
  isGenuineMongoDBVisible: PropTypes.bool.isRequired,
  toggleIsGenuineMongoDBVisible: PropTypes.func.isRequired,
};

export default SidebarInstance;
