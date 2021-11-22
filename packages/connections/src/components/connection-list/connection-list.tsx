import { css, cx } from '@emotion/css';
import { spacing } from '@mongodb-js/compass-components';
import React, { Fragment } from 'react';
import {
  Button,
  Subtitle,
  Icon,
  uiColors,
  compassUIColors,
} from '@mongodb-js/compass-components';
import { ConnectionInfo } from 'mongodb-data-service';

import Connection from './connection';

const newConnectionButtonContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  padding: spacing[1],
  background: uiColors.gray.dark3,
  position: 'relative',
  fontWeight: 'bold',
});

const newConnectionButtonStyles = css({
  borderRadius: 0,
});

const sectionHeaderStyles = css({
  marginTop: spacing[3],
  marginBottom: spacing[2],
  paddingLeft: spacing[3],
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
});

const sectionHeaderTitleStyles = css({
  color: 'white',
  flexGrow: 1,
});

const sectionHeaderIconSize = spacing[3];
const sectionHeaderIconStyles = css({
  fontSize: sectionHeaderIconSize,
  margin: 0,
  marginRight: spacing[2],
  padding: 0,
});

const connectionListSectionStyles = css({
  overflowY: 'auto',
  padding: 0,
  paddingBottom: spacing[3],
  '::-webkit-scrollbar-thumb': {
    background: compassUIColors.transparentGray,
  },
});

const connectionListStyles = css({
  listStyleType: 'none',
  margin: 0,
  padding: 0,
});

export type ConnectionInfoFavorite = ConnectionInfo &
  Required<Pick<ConnectionInfo, 'favorite'>>;

function ConnectionList({
  activeConnectionId,
  connections,
  createNewConnection,
  setActiveConnectionId,
}: {
  activeConnectionId?: string;
  connections: ConnectionInfo[];
  createNewConnection: () => void;
  setActiveConnectionId: (connectionId?: string) => void;
}): React.ReactElement {
  const favoriteConnections = connections
    .filter(
      (connectionInfo): connectionInfo is ConnectionInfoFavorite =>
        !!connectionInfo.favorite
    )
    .sort((a: ConnectionInfoFavorite, b: ConnectionInfoFavorite) => {
      return b.favorite.name.toLocaleLowerCase() <
        a.favorite.name.toLocaleLowerCase()
        ? 1
        : -1;
    });

  const recentConnections = connections
    .filter((connectionInfo) => !connectionInfo.favorite)
    .sort((a, b) => {
      // The `lastUsed` value hasn't always existed, so we assign
      // them a date in 2016 for sorting if it isn't there.
      const aLastUsed = a.lastUsed ? a.lastUsed.getTime() : 1463658247465;
      const bLastUsed = b.lastUsed ? b.lastUsed.getTime() : 1463658247465;
      return bLastUsed - aLastUsed;
    });

  return (
    <Fragment>
      <div className={newConnectionButtonContainerStyles}>
        <Button
          className={newConnectionButtonStyles}
          darkMode
          onClick={createNewConnection}
          leftGlyph={<Icon glyph="Plus" />}
        >
          New Connection
        </Button>
      </div>
      <div className={connectionListSectionStyles}>
        <div className={sectionHeaderStyles}>
          <Icon
            className={sectionHeaderIconStyles}
            glyph="Favorite"
            size={sectionHeaderIconSize}
          />
          <Subtitle className={sectionHeaderTitleStyles}>Favorites</Subtitle>
        </div>
        <ul className={connectionListStyles}>
          {favoriteConnections.map((connectionInfo, index) => (
            <li
              data-testid="favorite-connection"
              key={`${connectionInfo.id || ''}-${index}`}
            >
              <Connection
                isActive={
                  !!activeConnectionId &&
                  activeConnectionId === connectionInfo.id
                }
                connectionInfo={connectionInfo}
                onClick={() => setActiveConnectionId(connectionInfo.id)}
              />
            </li>
          ))}
        </ul>
        <div className={sectionHeaderStyles}>
          {/* There is no leafygreen replacement for this icon */}
          <i className={cx('fa fa-fw fa-history', sectionHeaderIconStyles)} />
          <Subtitle className={sectionHeaderTitleStyles}>Recents</Subtitle>
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
              />
            </li>
          ))}
        </ul>
      </div>
    </Fragment>
  );
}

export default ConnectionList;
