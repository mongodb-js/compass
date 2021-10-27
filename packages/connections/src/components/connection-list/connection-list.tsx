/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import {
  ResizeHandle,
  ResizeDirection,
  spacing,
} from '@mongodb-js/compass-components';
import { useState } from 'react';
import {
  Button,
  Subtitle,
  Icon,
  uiColors,
} from '@mongodb-js/compass-components';
import { ConnectionInfo } from 'mongodb-data-service';

import Connection from './connection';
import { ButtonVariant } from '@mongodb-js/compass-components';

const initialSidebarWidth = 250;
const minSidebarWidth = 150;

const listContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
  padding: 0,
  maxWidth: '80%',
  minWidth: minSidebarWidth,
  height: '100%',
  position: 'relative',
  background: uiColors.gray.dark2,
  color: 'white',
});

const newConnectionButtonContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  padding: 0,
  paddingLeft: spacing[3],
  paddingRight: spacing[3],
  position: 'relative',
});

const sectionHeaderStyles = css({
  marginTop: spacing[3],
  paddingLeft: spacing[1],
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
});

const sectionHeaderTitleStyles = css({
  color: 'white',
  flexGrow: 1,
});

const seachHeaderIconSize = spacing[3];
const sectionHeaderIconStyles = css({
  fontSize: seachHeaderIconSize,
  margin: 0,
  marginRight: spacing[2],
  padding: 0,
});

const connectionListSectionStyles = css({
  overflowY: 'scroll',
  padding: spacing[3],
  paddingTop: 0,
});

function getMaxSidebarWidth() {
  return Math.max(minSidebarWidth, window.innerWidth - 100);
}

function ConnectionList({
  connections,
}: {
  connections: ConnectionInfo[];
}): React.ReactElement {
  const [width, setWidth] = useState(initialSidebarWidth);

  return (
    <div
      css={listContainerStyles}
      style={{
        width: width,
      }}
    >
      <ResizeHandle
        onChange={(newWidth) => setWidth(newWidth)}
        direction={ResizeDirection.RIGHT}
        value={width}
        minValue={minSidebarWidth}
        maxValue={getMaxSidebarWidth()}
        title="sidebar"
      />
      <div css={newConnectionButtonContainerStyles}>
        <Button
          darkMode
          onClick={() => alert('new connection')}
          leftGlyph={<Icon glyph="Plus" />}
          variant={ButtonVariant.PrimaryOutline}
        >
          New Connection
        </Button>
      </div>
      <div css={connectionListSectionStyles}>
        <div css={sectionHeaderStyles}>
          <Icon
            css={sectionHeaderIconStyles}
            glyph="Favorite"
            size={seachHeaderIconSize}
          />
          <Subtitle css={sectionHeaderTitleStyles}>Favorites</Subtitle>
        </div>
        {connections
          .filter((connection) => !!connection.favorite)
          .map((connection, index) => (
            <Connection
              connection={connection}
              key={`${connection.id || ''}-${index}`}
            />
          ))}
        <div css={sectionHeaderStyles}>
          <i className="fa fa-fw fa-history" css={sectionHeaderIconStyles} />
          <Subtitle css={sectionHeaderTitleStyles}>
            {/* There is no leafygreen replacement for this icon */}
            Recents
          </Subtitle>
        </div>
        {connections
          .filter((connection) => !connection.favorite)
          .map((connection, index) => (
            <Connection
              connection={connection}
              key={`${connection.id || ''}-${index}`}
            />
          ))}
      </div>
    </div>
  );
}

export default ConnectionList;
