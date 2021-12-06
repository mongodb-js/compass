import { css, cx } from '@emotion/css';
import React from 'react';
import { Icon, spacing, MongoDBLogoMark } from '@mongodb-js/compass-components';
import { isLocalhost, isAtlas } from 'mongodb-build-info';

const connectionFavoriteStyles = css({
  borderRadius: '50%',
  width: spacing[3],
  height: spacing[3],
  flexShrink: 0,
  marginTop: spacing[1] / 2,
  marginRight: spacing[2],
});

function ConnectionIcon({
  connectionString,
  color,
}: {
  connectionString: string;
  color: string;
}): React.ReactElement {
  const testId = 'connection-icon';

  if (isAtlas(connectionString)) {
    return (
      <MongoDBLogoMark
        className={cx(
          connectionFavoriteStyles,
          css({
            path: {
              fill: color,
            },
          })
        )}
        data-testid={testId}
      />
    );
  }

  const glyph = isLocalhost(connectionString) ? 'Laptop' : 'Cloud';
  return (
    <Icon
      glyph={glyph}
      className={connectionFavoriteStyles}
      fill={color}
      data-testid={testId}
    />
  );
}

export default ConnectionIcon;
