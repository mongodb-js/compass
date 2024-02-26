import React from 'react';
import { Button, Icon, css } from '@mongodb-js/compass-components';

export type ItemType = 'database' | 'collection';

const createButton = css({
  whiteSpace: 'nowrap',
});

export function useCreateControls(
  itemType: ItemType,
  onCreateClick?: () => void
): React.ReactElement | null {
  if (!onCreateClick) {
    return null;
  }

  return (
    <Button
      variant="primary"
      leftGlyph={<Icon role="presentation" glyph="Plus" />}
      onClick={() => {
        onCreateClick();
      }}
      className={createButton}
    >
      Create {itemType}
    </Button>
  );
}
