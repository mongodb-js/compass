import React, { useCallback, useMemo } from 'react';
import type { GroupedItemAction } from '@mongodb-js/compass-components';
import { ItemActionGroup } from '@mongodb-js/compass-components';
import type { InProgressIndex } from '../../modules/regular-indexes';

type Index = {
  name: string;
  status: InProgressIndex['status'];
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

  return (
    <ItemActionGroup<IndexAction>
      data-testid="index-actions"
      actions={indexActions}
      onAction={onAction}
    ></ItemActionGroup>
  );
};

export default IndexActions;
