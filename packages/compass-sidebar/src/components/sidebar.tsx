import React, { useCallback, useState } from 'react';
import { cloneDeep } from 'lodash';
import { connect } from 'react-redux';
import { getConnectionTitle } from '@mongodb-js/connection-storage/renderer';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import {
  css,
  spacing,
  ResizableSidebar,
  useToast,
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

import { setConnectionIsCSFLEEnabled } from '../modules/data-service';
import { updateAndSaveConnectionInfo } from '../modules/connection-info';
import { toggleIsGenuineMongoDBVisible } from '../modules/is-genuine-mongodb-visible';
import { setIsExpanded } from '../modules/is-expanded';
import { maybeProtectConnectionString } from '@mongodb-js/compass-maybe-protect-connection-string';
import type { RootState } from '../modules';

const TOAST_TIMEOUT_MS = 5000; // 5 seconds.

// NOTE: This covers both the typical case where we have no badges and the case where we do.
const badgesPlaceholderStyles = css({
  paddingTop: spacing[3],
});

// eslint-disable-next-line no-empty-pattern
export function Sidebar({
  activeWorkspace,
  isExpanded,
  connectionInfo,
  globalAppRegistryEmit,
  updateAndSaveConnectionInfo,
  isGenuineMongoDBVisible,
  toggleIsGenuineMongoDBVisible,
  setIsExpanded,
  setConnectionIsCSFLEEnabled,
  isGenuine,
  csfleMode,
}: {
  activeWorkspace: { type: string; namespace?: string } | null;
  isExpanded: boolean;
  connectionInfo: Omit<ConnectionInfo, 'id'> & Partial<ConnectionInfo>;
  globalAppRegistryEmit: any;
  updateAndSaveConnectionInfo: any;
  isGenuineMongoDBVisible: boolean;
  toggleIsGenuineMongoDBVisible: (isVisible: boolean) => void;
  setIsExpanded: (isExpanded: boolean) => void;
  setConnectionIsCSFLEEnabled: (enabled: boolean) => void;
  isGenuine?: boolean;
  csfleMode?: 'enabled' | 'disabled' | 'unavailable';
}) {
  const [isFavoriteModalVisible, setIsFavoriteModalVisible] = useState(false);
  const [isConnectionInfoModalVisible, setIsConnectionInfoModalVisible] =
    useState(false);

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
            description: 'Copied to clipboard.',
            variant: 'success',
            timeout: TOAST_TIMEOUT_MS,
          });
        } catch (err) {
          openToast('copy-to-clipboard', {
            title: 'Error',
            description:
              'An error occurred when copying to clipboard. Please try again.',
            variant: 'warning',
            timeout: TOAST_TIMEOUT_MS,
          });
        }
      }

      if (action === 'copy-connection-string') {
        void copyConnectionString(
          maybeProtectConnectionString(
            connectionInfo.connectionOptions.connectionString
          )
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

      if (action === 'expand-sidebar') {
        setIsExpanded(true);
        return;
      }

      globalAppRegistryEmit(action, ...rest);
    },
    [
      connectionInfo.connectionOptions.connectionString,
      setIsExpanded,
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

  return (
    <ResizableSidebar
      collapsable={true}
      expanded={isExpanded}
      setExpanded={setIsExpanded}
      data-testid="navigation-sidebar"
    >
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

        <NavigationItems
          currentLocation={activeWorkspace?.type ?? null}
          currentNamespace={activeWorkspace?.namespace ?? null}
          isExpanded={isExpanded}
          onAction={onAction}
        />

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

const mapStateToProps = (state: RootState) => ({
  isExpanded: state.isExpanded,
  connectionInfo: state.connectionInfo.connectionInfo,
  isGenuineMongoDBVisible: state.isGenuineMongoDBVisible,
  isGenuine: state.instance?.genuineMongoDB.isGenuine,
  csfleMode: state.instance?.csfleMode,
});

const MappedSidebar = connect(mapStateToProps, {
  globalAppRegistryEmit,
  updateAndSaveConnectionInfo,
  toggleIsGenuineMongoDBVisible,
  setIsExpanded,
  setConnectionIsCSFLEEnabled,
})(Sidebar);

export default MappedSidebar;
