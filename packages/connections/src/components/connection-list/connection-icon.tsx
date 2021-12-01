import { css } from '@emotion/css';
import React from 'react';
import {
  Icon,
  spacing,
} from '@mongodb-js/compass-components';
import { isLocalhost, isAtlas } from 'mongodb-build-info';
import { ConnectionInfo } from 'mongodb-data-service';

const connectionFavoriteStyles = css({
  borderRadius: '50%',
  width: 14,
  height: 14,
  flexShrink: 0,
  marginTop: spacing[1],
  marginRight: spacing[2],
});

function ConnectionIcon({ favorite, connectionOptions: {connectionString} }: ConnectionInfo): React.ReactElement {
  const fill = favorite ? favorite.color : '#FFF';
  const testId = 'connection-favorite-indicator';
  const glyph = isLocalhost(connectionString) ? 'Laptop' : isAtlas(connectionString) ? 'Mongo' : 'Cloud';
  return <Icon glyph={glyph} className={connectionFavoriteStyles} fill={fill} data-testid={testId}/>;
}

export default ConnectionIcon;
