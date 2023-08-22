import React from 'react';

import type { ConnectionFavoriteOptions } from '@mongodb-js/connection-storage/renderer';
import { useConnectionColor } from '@mongodb-js/connection-form';

import { css, spacing } from '@mongodb-js/compass-components';

export default function FavoriteIndicator({
  favorite,
}: {
  favorite: ConnectionFavoriteOptions;
}) {
  const { connectionColorToHex } = useConnectionColor();

  const favoriteColorHex = connectionColorToHex(favorite.color) ?? '';

  const favoriteCSS = css({
    backgroundColor: favoriteColorHex || 'transparent',
    height: spacing[2],
  });

  return <div className={favoriteCSS} />;
}
