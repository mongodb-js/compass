import React, { useCallback, useState } from 'react';
import { cloneDeep } from 'lodash';
import { connect } from 'react-redux';
import { getConnectionTitle } from 'mongodb-data-service';
import type { ConnectionInfo } from 'mongodb-data-service';
import {
  css,
  spacing,
  ResizableSidebar,
  useToast,
  ToastVariant,
} from '@mongodb-js/compass-components';
import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import { SaveConnectionModal } from '@mongodb-js/connection-form';

import SidebarTitle from './sidebar-title';
import FavoriteIndicator from './favorite-indicator';
import NavigationItems from './navigation-items';
import ConnectionInfoModal from './connection-info-modal';
import NonGenuineWarningModal from './non-genuine-warning-modal';
import CSFLEConnectionModal from './csfle-connection-modal';
import CSFLEMarker from './csfle-marker';
import NonGenuineMarker from './non-genuine-marker';

import { updateAndSaveConnectionInfo } from '../modules/connection-info';
import { toggleIsGenuineMongoDBVisible } from '../modules/is-genuine-mongodb-visible';
import type { MongoDBInstance } from 'mongodb-instance-model';

const TOAST_TIMEOUT_MS = 5000; // 5 seconds.

// NOTE: This covers both the typical case where we have no badges and the case where we do.
const badgesPlaceholderStyles = css({
  paddingTop: spacing[3],
});

// eslint-disable-next-line no-empty-pattern
export function Sidebar({
  connectionInfo,
  globalAppRegistryEmit,
  updateAndSaveConnectionInfo,
  isGenuineMongoDBVisible,
  toggleIsGenuineMongoDBVisible,
  isGenuine,
  csfleMode,
}: {
  connectionInfo: ConnectionInfo;
  globalAppRegistryEmit: any; // TODO
  updateAndSaveConnectionInfo: any; // TODO
  isGenuineMongoDBVisible: boolean;
  toggleIsGenuineMongoDBVisible: (isVisible: boolean) => void;
  isGenuine?: boolean;
  csfleMode?: 'enabled' | 'disabled' | 'unavailable';
}) {
  // TODO: toggle sidebar
  // TODO: sidebar instance
  //   - instance stats
  //   - csfle marker
  //   - csfle connection modal
  //   - non genuine warning pill
  //   - sidebar instance details

  const [isFavoriteModalVisible, setIsFavoriteModalVisible] = useState(false);
  const [isConnectionInfoModalVisible, setIsConnectionInfoModalVisible] =
    useState(false);
  const [isExpanded] = useState(true);

  const onClickSaveFavorite = useCallback(
    (newFavoriteInfo) => {
      setIsFavoriteModalVisible(false);

      return updateAndSaveConnectionInfo({
        ...cloneDeep(connectionInfo),
        favorite: newFavoriteInfo,
      });
    },
    [connectionInfo, updateAndSaveConnectionInfo, setIsFavoriteModalVisible]
  );

  const { openToast } = useToast('compass-connections');

  const onAction = useCallback(
    (action: string, ...rest: any[]) => {
      async function copyConnectionString(connectionString: string) {
        try {
          await navigator.clipboard.writeText(connectionString);
          openToast('copy-to-clipboard', {
            title: 'Success',
            body: 'Copied to clipboard.',
            variant: ToastVariant.Success,
            timeout: TOAST_TIMEOUT_MS,
          });
        } catch (err) {
          openToast('copy-to-clipboard', {
            title: 'Error',
            body: 'An error occurred when copying to clipboard. Please try again.',
            variant: ToastVariant.Warning,
            timeout: TOAST_TIMEOUT_MS,
          });
        }
      }

      if (action === 'copy-connection-string') {
        void copyConnectionString(
          connectionInfo.connectionOptions.connectionString
        );
        return;
      }

      if (action === 'edit-favorite') {
        setIsFavoriteModalVisible(true);
        return;
      }

      if (action === 'open-connection-info') {
        setIsConnectionInfoModalVisible(true);
        return;
      }

      globalAppRegistryEmit(action, ...rest);
    },
    [
      connectionInfo.connectionOptions.connectionString,
      globalAppRegistryEmit,
      openToast,
    ]
  );

  const showNonGenuineModal = useCallback(() => {
    toggleIsGenuineMongoDBVisible(true);
  }, [toggleIsGenuineMongoDBVisible]);

  const [isCSFLEModalVisible, setIsCSFLEModalVisible] = useState(false);

  const toggleCSFLEModalVisible = useCallback(() => {
    setIsCSFLEModalVisible(!isCSFLEModalVisible);
  }, [setIsCSFLEModalVisible, isCSFLEModalVisible]);

  const setConnectionIsCSFLEEnabled = useCallback(
    (enabled: boolean) => {
      globalAppRegistryEmit('sidebar-toggle-csfle-enabled', enabled);
    },
    [globalAppRegistryEmit]
  );

  return (
    <ResizableSidebar>
      <>
        <SidebarTitle
          title={getConnectionTitle(connectionInfo)}
          isFavorite={!!connectionInfo.favorite}
          isExpanded={isExpanded}
          onAction={onAction}
        />
        {connectionInfo.favorite && (
          <FavoriteIndicator favorite={connectionInfo.favorite} />
        )}

        <div className={badgesPlaceholderStyles}>
          {isExpanded && (
            <NonGenuineMarker
              isGenuine={isGenuine}
              showNonGenuineModal={showNonGenuineModal}
            />
          )}
          {isExpanded && (
            <CSFLEMarker
              csfleMode={csfleMode}
              toggleCSFLEModalVisible={toggleCSFLEModalVisible}
            />
          )}
        </div>

        <NavigationItems isExpanded={isExpanded} onAction={onAction} />

        <SaveConnectionModal
          initialFavoriteInfo={connectionInfo.favorite}
          open={isFavoriteModalVisible}
          onCancelClicked={() => setIsFavoriteModalVisible(false)}
          onSaveClicked={(favoriteInfo) => onClickSaveFavorite(favoriteInfo)}
        />
        <NonGenuineWarningModal
          isVisible={isGenuineMongoDBVisible}
          toggleIsVisible={toggleIsGenuineMongoDBVisible}
        />
        <CSFLEConnectionModal
          open={isCSFLEModalVisible}
          setOpen={(open: boolean) => setIsCSFLEModalVisible(open)}
          csfleMode={csfleMode}
          setConnectionIsCSFLEEnabled={setConnectionIsCSFLEEnabled}
        />
        <ConnectionInfoModal
          isVisible={isConnectionInfoModalVisible}
          close={() => setIsConnectionInfoModalVisible(false)}
        />
      </>
    </ResizableSidebar>
  );
}

const mapStateToProps = (state: {
  connectionInfo: {
    connectionInfo: ConnectionInfo;
  };
  isGenuineMongoDBVisible: boolean;
  instance?: MongoDBInstance;
}) => ({
  connectionInfo: state.connectionInfo.connectionInfo,
  isGenuineMongoDBVisible: state.isGenuineMongoDBVisible,
  isGenuine: state.instance?.genuineMongoDB.isGenuine,
  csfleMode: state.instance?.csfleMode,
});

const MappedSidebar = connect(mapStateToProps, {
  globalAppRegistryEmit,
  updateAndSaveConnectionInfo,
  toggleIsGenuineMongoDBVisible,
})(Sidebar);

export default MappedSidebar;
