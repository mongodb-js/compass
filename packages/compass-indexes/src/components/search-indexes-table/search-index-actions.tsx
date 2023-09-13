import React, { useCallback, useMemo } from 'react';
import type { GroupedItemAction } from '@mongodb-js/compass-components';
import { ItemActionGroup } from '@mongodb-js/compass-components';
import type { SearchIndex } from 'mongodb-data-service';

type IndexActionsProps = {
  index: SearchIndex;
  onDropIndex: (name: string) => void;
};

type SearchIndexAction = 'drop';

const IndexActions: React.FunctionComponent<IndexActionsProps> = ({
  index,
  onDropIndex,
}) => {
  const indexActions: GroupedItemAction<SearchIndexAction>[] = useMemo(() => {
    const actions: GroupedItemAction<SearchIndexAction>[] = [
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
        onDropIndex(index.name);
      }
    },
    [onDropIndex, index]
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
