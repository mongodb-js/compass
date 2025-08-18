import React, { useCallback, useMemo } from 'react';
import type { GroupedItemAction } from '@mongodb-js/compass-components';
import {
  ItemActionGroup,
  SpinLoader,
  Body,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import type { InProgressIndex } from '../../modules/regular-indexes';

const buildingTextStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[1],
  marginRight: spacing[2],
});

type Index = {
  name: string;
  status: InProgressIndex['status'];
  buildProgress?: number;
};

type IndexActionsProps = {
  index: Index;
  onDeleteFailedIndexClick: (name: string) => void;
};

type IndexAction = 'delete';

const IndexActions: React.FunctionComponent<IndexActionsProps> = ({
  index,
  onDeleteFailedIndexClick,
}) => {
  const indexActions: GroupedItemAction<IndexAction>[] = useMemo(() => {
    const actions: GroupedItemAction<IndexAction>[] = [];

    // you can only drop regular indexes or failed inprogress indexes
    if (index.status === 'failed') {
      actions.push({
        action: 'delete',
        label: `Drop Index ${index.name}`,
        icon: 'Trash',
      });
    }

    return actions;
  }, [index]);

  const onAction = useCallback(
    (action: IndexAction) => {
      if (action === 'delete') {
        onDeleteFailedIndexClick(index.name);
      }
    },
    [onDeleteFailedIndexClick, index]
  );

  const progress = (index.buildProgress ?? 0) * 100;
  const isBuilding = progress > 0 && progress < 100;

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {isBuilding && (
        <div
          className={buildingTextStyles}
          data-testid="index-building-spinner"
        >
          <SpinLoader size={16} title="Index build in progress" />
          <Body>Building... {progress | 0}%</Body>
        </div>
      )}
      <ItemActionGroup<IndexAction>
        data-testid="index-actions"
        actions={indexActions}
        onAction={onAction}
      />
    </div>
  );
};

export default IndexActions;
