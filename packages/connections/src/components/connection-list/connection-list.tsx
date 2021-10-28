/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { spacing } from '@mongodb-js/compass-components';
import { Fragment } from 'react';
import {
  Button,
  Subtitle,
  Icon,
  uiColors,
} from '@mongodb-js/compass-components';
import { ConnectionInfo } from 'mongodb-data-service';

import Connection from './connection';

const newConnectionButtonContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  padding: spacing[3],
  background: uiColors.gray.dark3,
  position: 'relative',
});

const sectionHeaderStyles = css({
  marginTop: spacing[3],
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
    background: 'rgba(180, 180, 180, 0.5)',
  },
});

const connectionListStyles = css({
  listStyleType: 'none',
  margin: 0,
  padding: 0,
});

function ConnectionList({
  activeConnectionId,
  connections,
  setActiveConnectionId,
}: {
  activeConnectionId?: string;
  connections: ConnectionInfo[];
  setActiveConnectionId: (connectionId?: string) => void;
}): React.ReactElement {
  return (
    <Fragment>
      <div css={newConnectionButtonContainerStyles}>
        <Button
          darkMode
          onClick={() => setActiveConnectionId()}
          leftGlyph={<Icon glyph="Plus" />}
        >
          New Connection
        </Button>
      </div>
      <div css={connectionListSectionStyles}>
        <div css={sectionHeaderStyles}>
          <Icon
            css={sectionHeaderIconStyles}
            glyph="Favorite"
            size={sectionHeaderIconSize}
          />
          <Subtitle css={sectionHeaderTitleStyles}>Favorites</Subtitle>
        </div>
        <ul css={connectionListStyles}>
          {connections
            .filter((connection) => !!connection.favorite)
            .map((connection, index) => (
              <li key={`${connection.id || ''}-${index}`}>
                <Connection
                  isActive={
                    !!activeConnectionId && activeConnectionId === connection.id
                  }
                  connection={connection}
                  onClick={() => setActiveConnectionId(connection.id)}
                />
              </li>
            ))}
        </ul>
        <div css={sectionHeaderStyles}>
          {/* There is no leafygreen replacement for this icon */}
          <i className="fa fa-fw fa-history" css={sectionHeaderIconStyles} />
          <Subtitle css={sectionHeaderTitleStyles}>Recents</Subtitle>
        </div>
        <ul css={connectionListStyles}>
          {connections
            .filter((connection) => !connection.favorite)
            .map((connection, index) => (
              <li key={`${connection.id || ''}-${index}`}>
                <Connection
                  isActive={
                    !!activeConnectionId && activeConnectionId === connection.id
                  }
                  connection={connection}
                  onClick={() => setActiveConnectionId(connection.id)}
                />
              </li>
            ))}
        </ul>
      </div>
    </Fragment>
  );
}

export default ConnectionList;
