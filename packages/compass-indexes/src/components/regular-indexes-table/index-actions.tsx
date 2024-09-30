import semver from 'semver';
import React, { useCallback, useMemo } from 'react';
import type { GroupedItemAction } from '@mongodb-js/compass-components';
import { ItemActionGroup } from '@mongodb-js/compass-components';
import type { InProgressIndex } from '../../modules/regular-indexes';

/*
TODO: we can change this to
{ name: string } & (
 | { compassIndexType: 'regular-index', extra?: { hidden?: boolean } }
 | { compassIndexType: 'in-progress-index', status: InProgressIndex['status']}
 | { compassIndexType: 'rolling-index' }
)
 but at that point it is probably better to just have IndexActions components
 per index type?
*/
type IndexActionsIndex = {
  name: string;
  compassIndexType: 'regular-index' | 'in-progress-index' | 'rolling-index';
  extra?: {
    hidden?: boolean;
  };
  status?: InProgressIndex['status'];
};

type IndexActionsProps = {
  index: IndexActionsIndex;
  serverVersion: string;
  onDeleteIndexClick: (name: string) => void;
  onHideIndexClick: (name: string) => void;
  onUnhideIndexClick: (name: string) => void;
};

type IndexAction = 'delete' | 'hide' | 'unhide';

const MIN_HIDE_INDEX_SERVER_VERSION = '4.4.0';

const serverSupportsHideIndex = (serverVersion: string) => {
  try {
    return semver.gte(serverVersion, MIN_HIDE_INDEX_SERVER_VERSION);
  } catch (e) {
    return true;
  }
};

const IndexActions: React.FunctionComponent<IndexActionsProps> = ({
  index,
  serverVersion,
  onDeleteIndexClick,
  onHideIndexClick,
  onUnhideIndexClick,
}) => {
  const indexActions: GroupedItemAction<IndexAction>[] = useMemo(() => {
    const actions: GroupedItemAction<IndexAction>[] = [];

    if (
      index.compassIndexType === 'regular-index' &&
      serverSupportsHideIndex(serverVersion)
    ) {
      actions.push(
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
            }
      );
    }

    // you can only drop regular indexes or failed inprogress indexes
    if (
      (index.compassIndexType === 'in-progress-index' &&
        index.status === 'failed') ||
      index.compassIndexType === 'regular-index'
    ) {
      actions.push({
        action: 'delete',
        label: `Drop Index ${index.name}`,
        icon: 'Trash',
      });
    }

    return actions;
  }, [index, serverVersion]);

  const onAction = useCallback(
    (action: IndexAction) => {
      if (action === 'delete') {
        onDeleteIndexClick(index.name);
      } else if (action === 'hide') {
        onHideIndexClick(index.name);
      } else if (action === 'unhide') {
        onUnhideIndexClick(index.name);
      }
    },
    [onDeleteIndexClick, onHideIndexClick, onUnhideIndexClick, index]
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
