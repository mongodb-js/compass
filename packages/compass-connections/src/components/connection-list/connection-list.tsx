import React, { Fragment, useMemo, useState } from 'react';
import {
  Button,
  FavoriteIcon,
  H3,
  Icon,
  palette,
  spacing,
  css,
  cx,
  useDarkMode,
  useHoverState,
  ItemActionControls,
} from '@mongodb-js/compass-components';
import type { ItemAction } from '@mongodb-js/compass-components';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import type AppRegistry from 'hadron-app-registry';

import Connection from './connection';
import ConnectionsTitle from './connections-title';
import { TextInput } from '@mongodb-js/compass-components';

const newConnectionButtonContainerStyles = css({
  padding: spacing[3],
});

const savedConnectionsFilter = css({
  margin: `${spacing[2]}px ${spacing[3]}px`,
});

const newConnectionButtonStyles = css({
  width: '100%',
  justifyContent: 'center',
  fontWeight: 'bold',
  '> div': {
    width: 'auto',
  },
});

const newConnectionButtonStylesLight = css({
  backgroundColor: palette.white,
});
const newConnectionButtonStylesDark = css({
  backgroundColor: palette.gray.dark2,
});

const sectionHeaderStyles = css({
  marginTop: spacing[4],
  marginBottom: spacing[3],
  paddingLeft: spacing[3],
  paddingRight: spacing[2],
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  ':hover': {},
});

const recentHeaderStyles = css({
  marginTop: spacing[4],
});

const sectionHeaderTitleStyles = css({
  flexGrow: 1,
  fontSize: '16px',
  lineHeight: '24px',
  fontWeight: 700,
});

const sectionHeaderTitleStylesLight = css({
  color: palette.gray.dark3,
});

const sectionHeaderTitleStylesDark = css({
  color: 'white',
});

const sectionHeaderIconStyles = css({
  fontSize: spacing[3],
  margin: 0,
  marginRight: spacing[2],
  padding: 0,
  display: 'flex',
});

const connectionListSectionStyles = css({
  overflowY: 'auto',
  padding: 0,
  paddingBottom: spacing[3],
});

const connectionListStyles = css({
  listStyleType: 'none',
  margin: 0,
  padding: 0,
});

const MIN_FAV_CONNECTIONS_TO_SHOW_FILTER = 10;

function RecentIcon() {
  const darkMode = useDarkMode();

  const color = darkMode ? 'white' : palette.gray.dark3;

  return (
    <svg
      width={spacing[4]}
      height={spacing[4]}
      viewBox="0 0 24 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.66663 11.6667C9.66663 14.0566 11.6101 16 14 16C16.3899 16 18.3333 14.0566 18.3333 11.6667C18.3333 9.27677 16.3899 7.33333 14 7.33333C11.6101 7.33333 9.66663 9.27677 9.66663 11.6667Z"
        stroke={color}
      />
      <path
        d="M4.99998 12.449C4.99998 12.2348 4.99998 12.0475 4.99998 11.8333C4.99998 6.96162 8.9616 3 13.8333 3C18.705 3 22.6666 6.96162 22.6666 11.8333C22.6666 16.705 18.705 20.6667 13.8333 20.6667M1.33331 9L4.63998 12.1795C4.85331 12.3846 5.17331 12.3846 5.35998 12.1795L8.66665 9"
        stroke={color}
        strokeMiterlimit="10"
      />
      <path d="M13.6666 10V12H15.6666" stroke={color} strokeMiterlimit="10" />
    </svg>
  );
}

export type ConnectionInfoFavorite = ConnectionInfo &
  Required<Pick<ConnectionInfo, 'favorite'>>;

type FavoriteAction = 'import-favorites' | 'export-favorites';

const favoriteActions: ItemAction<FavoriteAction>[] = [
  {
    action: 'import-favorites',
    label: 'Import saved connections',
    icon: 'Download',
  },
  {
    action: 'export-favorites',
    label: 'Export saved connections',
    icon: 'Export',
  },
];

function ConnectionList({
  activeConnectionId,
  appRegistry,
  recentConnections,
  favoriteConnections,
  createNewConnection,
  setActiveConnectionId,
  onDoubleClick,
  removeAllRecentsConnections,
  duplicateConnection,
  removeConnection,
  openConnectionImportExportModal,
}: {
  activeConnectionId?: string;
  appRegistry: AppRegistry;
  recentConnections: ConnectionInfo[];
  favoriteConnections: ConnectionInfo[];
  createNewConnection: () => void;
  setActiveConnectionId: (connectionId: string) => void;
  onDoubleClick: (connectionInfo: ConnectionInfo) => void;
  removeAllRecentsConnections: () => void;
  duplicateConnection: (connectionInfo: ConnectionInfo) => void;
  removeConnection: (connectionInfo: ConnectionInfo) => void;
  openConnectionImportExportModal: (modal: FavoriteAction) => void;
}): React.ReactElement {
  const darkMode = useDarkMode();
  const [recentHoverProps, recentHeaderHover] = useHoverState();
  const [favoriteHoverProps, favoriteHeaderHover] = useHoverState();

  const [favoriteConnectionsFilter, setSavedConnectionsFilter] = useState('');

  const filteredSavedConnections = useMemo(() => {
    if (!favoriteConnectionsFilter) {
      return favoriteConnections;
    }

    return favoriteConnections.filter((connection) =>
      connection.favorite?.name
        ?.toLowerCase()
        .includes(favoriteConnectionsFilter.toLowerCase())
    );
  }, [favoriteConnections, favoriteConnectionsFilter]);
  const showFilteredSavedConnections =
    favoriteConnections.length > MIN_FAV_CONNECTIONS_TO_SHOW_FILTER;

  return (
    <Fragment>
      <ConnectionsTitle
        onAction={(actionName: string) => appRegistry.emit(actionName)}
      />
      <div className={newConnectionButtonContainerStyles}>
        <Button
          className={cx(
            newConnectionButtonStyles,
            darkMode
              ? newConnectionButtonStylesDark
              : newConnectionButtonStylesLight
          )}
          onClick={createNewConnection}
          size="default"
          data-testid="new-connection-button"
          rightGlyph={<Icon glyph="Plus" />}
        >
          New connection
        </Button>
      </div>
      <div className={connectionListSectionStyles}>
        <div
          className={sectionHeaderStyles}
          {...favoriteHoverProps}
          data-testid="favorite-connections-list-header"
        >
          <div className={sectionHeaderIconStyles}>
            <FavoriteIcon />
          </div>
          <H3
            className={cx(
              sectionHeaderTitleStyles,
              darkMode
                ? sectionHeaderTitleStylesDark
                : sectionHeaderTitleStylesLight
            )}
          >
            Saved connections
          </H3>
          <ItemActionControls<FavoriteAction>
            data-testid="favorites-menu"
            onAction={openConnectionImportExportModal}
            iconSize="small"
            actions={favoriteActions}
            isVisible={favoriteHeaderHover}
          ></ItemActionControls>
        </div>
        {showFilteredSavedConnections && (
          <TextInput
            data-testid="sidebar-filter-saved-connections-input"
            placeholder="Search"
            type="search"
            aria-label="Saved connections filter"
            title="Saved connections filter"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSavedConnectionsFilter(e.target.value)
            }
            className={savedConnectionsFilter}
          />
        )}
        <ul className={connectionListStyles}>
          {(showFilteredSavedConnections
            ? filteredSavedConnections
            : favoriteConnections
          ).map((connectionInfo, index) => (
            <li
              data-testid="favorite-connection"
              data-id={`favorite-connection-${
                connectionInfo?.favorite?.name || ''
              }`}
              key={`${connectionInfo.id || ''}-${index}`}
            >
              <Connection
                data-testid="favorite-connection"
                key={`${connectionInfo.id || ''}-${index}`}
                isActive={
                  !!activeConnectionId &&
                  activeConnectionId === connectionInfo.id
                }
                connectionInfo={connectionInfo}
                onClick={() => setActiveConnectionId(connectionInfo.id)}
                onDoubleClick={onDoubleClick}
                removeConnection={removeConnection}
                duplicateConnection={duplicateConnection}
              />
            </li>
          ))}
        </ul>
        <div
          className={cx(sectionHeaderStyles, recentHeaderStyles)}
          {...recentHoverProps}
          data-testid="recent-connections-list-header"
        >
          <div className={sectionHeaderIconStyles}>
            <RecentIcon />
          </div>
          <H3
            data-testid="recents-header"
            className={cx(
              sectionHeaderTitleStyles,
              darkMode
                ? sectionHeaderTitleStylesDark
                : sectionHeaderTitleStylesLight
            )}
          >
            Recents
          </H3>
          {recentHeaderHover && (
            <Button
              onClick={removeAllRecentsConnections}
              variant="default"
              size="xsmall"
            >
              Clear All
            </Button>
          )}
        </div>
        <ul className={connectionListStyles}>
          {recentConnections.map((connectionInfo, index) => (
            <li
              data-testid="recent-connection"
              key={`${connectionInfo.id || ''}-${index}`}
            >
              <Connection
                isActive={
                  !!activeConnectionId &&
                  activeConnectionId === connectionInfo.id
                }
                connectionInfo={connectionInfo}
                onClick={() => setActiveConnectionId(connectionInfo.id)}
                onDoubleClick={onDoubleClick}
                removeConnection={removeConnection}
                duplicateConnection={duplicateConnection}
              />
            </li>
          ))}
        </ul>
      </div>
    </Fragment>
  );
}

export default ConnectionList;
