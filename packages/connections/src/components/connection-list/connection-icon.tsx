import { css, cx } from '@emotion/css';
import React from 'react';
import {
  Icon,
  spacing,
  MongoDBLogoMark,
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
  const fill = favorite?.color ?? '#FFF';
  const testId = 'connection-icon';

  if (isAtlas(connectionString)) {
    return <MongoDBLogoMark className={cx(
      connectionFavoriteStyles,
      css({
        'path': {
          fill,
        }
      }),
    )} data-testid={testId}/>
  }

  const glyph = isLocalhost(connectionString) ? 'Laptop' : 'Cloud';
  return <Icon glyph={glyph} className={connectionFavoriteStyles} fill={fill} data-testid={testId}/>;
}

export default ConnectionIcon;
