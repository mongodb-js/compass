import React, { useCallback, useState } from 'react';
import { cloneDeep } from 'lodash';
import { connect } from 'react-redux';
import { getConnectionTitle } from '@mongodb-js/connection-info';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import {
  css,
  spacing,
  ResizableSidebar,
  useToast,
} from '@mongodb-js/compass-components';
import { SaveConnectionModal } from '@mongodb-js/connection-form';
import { useConnections } from '@mongodb-js/compass-connections/provider';

import SidebarTitle from './sidebar-title';
import NavigationItems from './navigation-items';
import ConnectionInfoModal from '../connection-info-modal';
import CSFLEConnectionModal from '../csfle-connection-modal';
import CSFLEMarker from '../csfle-marker';
import NonGenuineMarker from '../non-genuine-marker';

import { setConnectionIsCSFLEEnabled } from '../../modules/data-service';
import { useMaybeProtectConnectionString } from '@mongodb-js/compass-maybe-protect-connection-string';
import type { RootState, SidebarThunkAction } from '../../modules';
import type { WorkspaceTab } from '@mongodb-js/compass-workspaces';

const TOAST_TIMEOUT_MS = 5000; // 5 seconds.

const sidebarStyles = css({
  // Sidebar internally has z-indexes higher than zero. We set zero on the
  // container so that the sidebar doesn't stick out in the layout z ordering
  // with other parts of the app
  zIndex: 0,
});

const connectionBadgesContainerStyles = css({
  display: 'grid',
  gridTemplateColumns: '100%',
  gridTemplateRows: 'auto',
  gap: spacing[2],
  marginTop: spacing[3],
  '&:empty': {
    display: 'none',
  },
});

const navigationItemsContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  marginTop: spacing[2],
  '&:first-child': {
    marginTop: 2,
  },
});

// eslint-disable-next-line no-empty-pattern
export function Sidebar({
  showConnectionInfo = true,
  activeWorkspace,
  initialConnectionInfo,
  setConnectionIsCSFLEEnabled,
  isGenuine,
  csfleMode,
  onSidebarAction,
}: {
  showConnectionInfo?: boolean;
  activeWorkspace: WorkspaceTab | null;
  initialConnectionInfo: ConnectionInfo;
  setConnectionIsCSFLEEnabled: (connectionId: string, enabled: boolean) => void;
  isGenuine?: boolean;
  csfleMode?: 'enabled' | 'disabled' | 'unavailable';
  onSidebarAction(action: string, ...rest: any[]): void;
}) {
  const { saveEditedConnection, showNonGenuineMongoDBWarningModal } =
    useConnections();
  const [isFavoriteModalVisible, setIsFavoriteModalVisible] = useState(false);
  const [isConnectionInfoModalVisible, setIsConnectionInfoModalVisible] =
    useState(false);

  const onClickSaveFavorite = useCallback(
    (newFavoriteInfo) => {
      setIsFavoriteModalVisible(false);

      return saveEditedConnection({
        ...cloneDeep(initialConnectionInfo),
        favorite: newFavoriteInfo,
        savedConnectionType: 'favorite',
      });
    },
    [initialConnectionInfo, saveEditedConnection]
  );

  const { openToast } = useToast('compass-connections');
  const maybeProtectConnectionString = useMaybeProtectConnectionString();

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
            initialConnectionInfo.connectionOptions.connectionString ?? ''
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

      if (action === 'open-create-database') {
        onSidebarAction(action, ...rest, {
          connectionId: initialConnectionInfo.id,
        });
        return;
      }

      if (action === 'refresh-databases') {
        onSidebarAction(action, ...rest, {
          connectionId: initialConnectionInfo.id,
        });
        return;
      }

      onSidebarAction(action, ...rest);
    },
    [
      initialConnectionInfo.id,
      onSidebarAction,
      openToast,
      maybeProtectConnectionString,
      initialConnectionInfo.connectionOptions.connectionString,
    ]
  );

  const [isCSFLEModalVisible, setIsCSFLEModalVisible] = useState(false);

  const toggleCSFLEModalVisible = useCallback(() => {
    setIsCSFLEModalVisible(!isCSFLEModalVisible);
  }, [setIsCSFLEModalVisible, isCSFLEModalVisible]);

  return (
    <ResizableSidebar
      data-testid="navigation-sidebar"
      className={sidebarStyles}
    >
      <>
        {showConnectionInfo && (
          <div>
            <SidebarTitle
              title={getConnectionTitle(initialConnectionInfo)}
              isFavorite={!!initialConnectionInfo.favorite}
              favoriteColor={initialConnectionInfo.favorite?.color}
              onAction={onAction}
            />
            <div className={connectionBadgesContainerStyles}>
              <NonGenuineMarker
                isGenuine={isGenuine}
                showNonGenuineModal={() => {
                  showNonGenuineMongoDBWarningModal(initialConnectionInfo.id);
                }}
              />
              <CSFLEMarker
                csfleMode={csfleMode}
                toggleCSFLEModalVisible={toggleCSFLEModalVisible}
              />
            </div>
          </div>
        )}

        <div className={navigationItemsContainerStyles}>
          <NavigationItems
            connectionInfo={initialConnectionInfo}
            activeWorkspace={activeWorkspace}
            onAction={onAction}
          />
        </div>

        <SaveConnectionModal
          initialFavoriteInfo={initialConnectionInfo.favorite}
          open={isFavoriteModalVisible}
          onCancelClicked={() => setIsFavoriteModalVisible(false)}
          onSaveClicked={(favoriteInfo) => onClickSaveFavorite(favoriteInfo)}
        />
        <CSFLEConnectionModal
          open={isCSFLEModalVisible}
          csfleMode={csfleMode}
          onClose={() => setIsCSFLEModalVisible(false)}
          setConnectionIsCSFLEEnabled={(enabled) =>
            setConnectionIsCSFLEEnabled(initialConnectionInfo.id, enabled)
          }
        />
        <ConnectionInfoModal
          connectionInfo={initialConnectionInfo}
          isVisible={isConnectionInfoModalVisible}
          close={() => setIsConnectionInfoModalVisible(false)}
        />
      </>
    </ResizableSidebar>
  );
}

const mapStateToProps = (
  state: RootState,
  {
    initialConnectionInfo,
  }: {
    initialConnectionInfo: Partial<ConnectionInfo> & Pick<ConnectionInfo, 'id'>;
  }
) => {
  return {
    isGenuine:
      state.instance[initialConnectionInfo.id]?.genuineMongoDB.isGenuine,
    csfleMode: state.instance[initialConnectionInfo.id]?.csfleMode,
  };
};

const onSidebarAction = (
  action: string,
  ...rest: any[]
): SidebarThunkAction<void> => {
  return (_dispatch, _getState, { globalAppRegistry }) => {
    globalAppRegistry.emit(action, ...rest);
  };
};

const MappedSidebar = connect(mapStateToProps, {
  setConnectionIsCSFLEEnabled,
  onSidebarAction,
})(Sidebar);

export default MappedSidebar;
