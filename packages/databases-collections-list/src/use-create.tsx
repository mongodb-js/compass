import React from 'react';
import { Button } from '@mongodb-js/compass-components';
import { createButton } from './items-grid';

export type ItemType = 'database' | 'collection';

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
      onClick={() => {
        onCreateClick();
      }}
      className={createButton}
    >
      Create {itemType}
    </Button>
  );
}
