import React, { useCallback, useMemo } from 'react';
import type { GroupedItemAction } from '@mongodb-js/compass-components';
import {
  Button,
  ItemActionGroup,
  css,
  cx,
  spacing,
} from '@mongodb-js/compass-components';
import type { SearchIndex } from 'mongodb-data-service';

type IndexActionsProps = {
  index: SearchIndex;
  onRunAggregateIndex: (name: string) => void;
  onDropIndex: (name: string) => void;
  onEditIndex: (name: string) => void;
};

type SearchIndexAction = 'drop' | 'edit';

const actionGroupStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
});

const IndexActions: React.FunctionComponent<IndexActionsProps> = ({
  index,
  onRunAggregateIndex,
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
        onDropIndex(index.name);
      } else if (action === 'edit') {
        onEditIndex(index.name);
      }
    },
    [onDropIndex, onEditIndex, index]
  );

  return (
    <div className={actionGroupStyles}>
      <Button
        data-testid="search-index-actions-aggregate-action"
        className={cx([!index.queryable && css({ visibility: 'hidden' })])}
        size="xsmall"
        onClick={() => onRunAggregateIndex(index.name)}
      >
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
