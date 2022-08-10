import React, { useCallback, useState } from 'react';
import { cloneDeep } from 'lodash';
import { connect } from 'react-redux';
import { getConnectionTitle } from 'mongodb-data-service';
import type { ConnectionInfo } from 'mongodb-data-service';
import {
  ResizableSidebar,
  useToast,
  ToastVariant,
} from '@mongodb-js/compass-components';
import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import { SaveConnectionModal } from '@mongodb-js/connection-form';

import SidebarDatabasesNavigation from './sidebar-databases-navigation';
import SidebarTitle from './sidebar-title';
import FavoriteIndicator from './favorite-indicator';

import { updateAndSaveConnectionInfo } from '../modules/connection-info';

const TOAST_TIMEOUT_MS = 5000; // 5 seconds.

// eslint-disable-next-line no-empty-pattern
export function Sidebar({
  connectionInfo,
  globalAppRegistryEmit,
  updateAndSaveConnectionInfo,
}: {
  connectionInfo: ConnectionInfo;
  globalAppRegistryEmit: any; // TODO
  updateAndSaveConnectionInfo: any; // TODO
}) {
  // TODO: toggle sidebar
  // TODO: sidebar instance
  //   - instance stats
  //   - csfle marker
  //   - csfle connection modal
  //   - save connection modal
  //   - non genuine warning pill
  //   - sidebar instance details
  // TODO: navigation items
  // TODO: filter
  // TODO: create database
  // TODO: non genuine warning label

  const [isFavoriteModalVisible, setIsFavoriteModalVisible] = useState(false);
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

  const onAction = useCallback((action: string) => {
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

    globalAppRegistryEmit(action);
  }, []);

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
        <SidebarDatabasesNavigation />
        <SaveConnectionModal
          initialFavoriteInfo={connectionInfo.favorite}
          open={isFavoriteModalVisible}
          onCancelClicked={() => setIsFavoriteModalVisible(false)}
          onSaveClicked={(favoriteInfo) => onClickSaveFavorite(favoriteInfo)}
        />
      </>
    </ResizableSidebar>
  );
}

const mapStateToProps = (state: {
  connectionInfo: {
    connectionInfo: ConnectionInfo;
  };
}) => ({
  connectionInfo: state.connectionInfo.connectionInfo,
});

const MappedSidebar = connect(mapStateToProps, {
  globalAppRegistryEmit,
  updateAndSaveConnectionInfo,
})(Sidebar);

export default MappedSidebar;
