import React, { useCallback, useMemo } from 'react';
import type { GroupedItemAction } from '@mongodb-js/compass-components';
import {
  ItemActionGroup,
  SpinLoader,
  Body,
  css,
} from '@mongodb-js/compass-components';
import type { InProgressIndex } from '../../modules/regular-indexes';

type Index = {
  name: string;
  status: InProgressIndex['status'];
  buildProgress: number;
};

const indexActionsContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '8px',
});

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

  const progress = index.buildProgress * 100;
  const isBuilding = progress > 0 && progress < 100;

  return (
    <div className={indexActionsContainerStyles}>
      {isBuilding && (
        <>
          <Body>Building… {progress | 0}%</Body>
          <SpinLoader
            size={16}
            title="Index build in progress"
            data-testid="index-building-spinner"
          />
        </>
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
