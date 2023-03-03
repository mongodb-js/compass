import React from 'react';
import { Button, Icon } from '@mongodb-js/compass-components';

export function useRefreshControls(
  onRefreshClick?: () => void
): React.ReactElement | null {
  if (!onRefreshClick) {
    return null;
  }

  return (
    <Button
      variant="default"
      leftGlyph={<Icon role="presentation" glyph="Refresh" />}
      onClick={() => {
        onRefreshClick();
      }}
    >
      Refresh
    </Button>
  );
}
