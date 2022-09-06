import React, { useCallback, useMemo } from 'react';
import type { ItemAction } from '@mongodb-js/compass-components';
import { ItemActionGroup } from '@mongodb-js/compass-components';
import type { IndexDefinition } from '../../modules/indexes';

type IndexActionsProps = {
  index: IndexDefinition;
  onDeleteIndex: (index: IndexDefinition) => void;
};

type IndexAction = 'delete';

const IndexActions: React.FunctionComponent<IndexActionsProps> = ({
  index,
  onDeleteIndex,
}) => {
  const indexActions: ItemAction<IndexAction>[] = useMemo(
    () => [
      {
        action: 'delete',
        label: `Drop Index ${index.name}`,
        icon: 'Trash',
      },
    ],
    [index]
  );

  const onAction = useCallback(
    (action: IndexAction) => {
      if (action === 'delete') {
        onDeleteIndex(index);
      }
    },
    [onDeleteIndex, index]
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
