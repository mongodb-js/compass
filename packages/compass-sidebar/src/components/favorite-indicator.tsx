import React from 'react';

import type { ConnectionFavoriteOptions } from '@mongodb-js/connection-storage/renderer';
import { useConnectionColor } from '@mongodb-js/connection-form';

import { css, spacing } from '@mongodb-js/compass-components';

const favoriteCSS = css({
  height: spacing[2],
});

export default function FavoriteIndicator({
  favoriteColor,
}: {
  favoriteColor: ConnectionFavoriteOptions['color'];
}) {
  const { connectionColorToHex } = useConnectionColor();

  const favoriteColorHex = connectionColorToHex(favoriteColor) ?? 'transparent';

  return (
    <div
      style={{ backgroundColor: favoriteColorHex }}
      className={favoriteCSS}
    />
  );
}
