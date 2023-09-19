import React, { useCallback, useMemo } from 'react';
import type { GroupedItemAction } from '@mongodb-js/compass-components';
import {
  Button,
  ItemActionGroup,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import type { SearchIndex } from 'mongodb-data-service';

type IndexActionsProps = {
  index: SearchIndex;
  onRunAggregateIndex: (name: string) => void;
  onDropIndex: (name: string) => void;
};

type SearchIndexAction = 'drop';

const actionGroupStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
});

const IndexActions: React.FunctionComponent<IndexActionsProps> = ({
  index,
  onRunAggregateIndex,
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
        void onDropIndex(index.name);
      }
    },
    [onDropIndex, index]
  );

  return (
    <div className={actionGroupStyles}>
      <Button size="xsmall" onClick={() => onRunAggregateIndex(index.name)}>
        Aggregate
      </Button>
      <ItemActionGroup<SearchIndexAction>
        data-testid="search-index-actions"
        actions={indexActions}
        onAction={onAction}
      ></ItemActionGroup>
    </div>
  );
};

export default IndexActions;
