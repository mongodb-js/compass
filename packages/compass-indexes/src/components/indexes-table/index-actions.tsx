import React, { useCallback, useMemo } from 'react';
import type { ItemAction } from '@mongodb-js/compass-components';
import { ItemActionGroup } from '@mongodb-js/compass-components';
import type { IndexDefinition } from '../../modules/indexes';

type IndexActionsProps = {
  index: IndexDefinition;
  onDeleteIndex: (index: IndexDefinition) => void;
  onHideIndex: (name: string) => void;
  onUnhideIndex: (name: string) => void;
};

type IndexAction = 'delete' | 'hide' | 'unhide';

const IndexActions: React.FunctionComponent<IndexActionsProps> = ({
  index,
  onDeleteIndex,
  onHideIndex,
  onUnhideIndex,
}) => {
  const indexActions: ItemAction<IndexAction>[] = useMemo(
    () => [
      index.extra?.hidden
        ? {
            action: 'unhide',
            label: `Unhide Index ${index.name}`,
            tooltip: `Unhide Index`,
            icon: 'Visibility',
          }
        : {
            action: 'hide',
            label: `Hide Index ${index.name}`,
            tooltip: `Hide Index`,
            icon: 'VisibilityOff',
          },
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
      } else if (action === 'hide') {
        onHideIndex(index.name);
      } else if (action === 'unhide') {
        onUnhideIndex(index.name);
      }
    },
    [onDeleteIndex, onHideIndex, onUnhideIndex, index]
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
