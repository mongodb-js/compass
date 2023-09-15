import React, { useCallback, useMemo } from 'react';
import type { GroupedItemAction } from '@mongodb-js/compass-components';
import { ItemActionGroup } from '@mongodb-js/compass-components';
import type { SearchIndex } from 'mongodb-data-service';

type IndexActionsProps = {
  index: SearchIndex;
  onDropIndex: (name: string) => void;
  onEditIndex: (name: string, definition: string) => void;
};

type SearchIndexAction = 'drop' | 'edit';

const IndexActions: React.FunctionComponent<IndexActionsProps> = ({
  index,
  onDropIndex,
  onEditIndex,
}) => {
  const indexActions: GroupedItemAction<SearchIndexAction>[] = useMemo(() => {
    const actions: GroupedItemAction<SearchIndexAction>[] = [
      {
        action: 'edit',
        label: `Edit Index ${index.name}`,
        icon: 'Edit',
      },
      {
        action: 'drop',
        label: `Drop Index ${index.name}`,
        icon: 'Trash',
      },
    ];

    return actions;
  }, [index]);

  const onAction = useCallback(
    (action: SearchIndexAction) => {
      if (action === 'drop') {
        void onDropIndex(index.name);
      } else if (action === 'edit') {
        void onEditIndex(
          index.name,
          JSON.stringify(index.latestDefinition, undefined, 2)
        );
      }
    },
    [onDropIndex, onEditIndex, index]
  );

  return (
    <ItemActionGroup<SearchIndexAction>
      data-testid="search-index-actions"
      actions={indexActions}
      onAction={onAction}
    ></ItemActionGroup>
  );
};

export default IndexActions;
