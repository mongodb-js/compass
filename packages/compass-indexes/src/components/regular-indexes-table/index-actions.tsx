import semver from 'semver';
import React, { useCallback, useMemo } from 'react';
import type { GroupedItemAction } from '@mongodb-js/compass-components';
import { ItemActionGroup } from '@mongodb-js/compass-components';
import type { RegularIndex } from '../../modules/regular-indexes';

type IndexActionsProps = {
  collectionIsSharded: boolean;
  index: RegularIndex;
  serverVersion: string;
  onDeleteIndex: (name: string) => void;
  onHideIndex: (name: string) => void;
  onUnhideIndex: (name: string) => void;
  onShardOnIndex: (key: Record<string, unknown>) => void;
  onShowShardDistribution: () => void;
};

type IndexAction =
  | 'delete'
  | 'hide'
  | 'unhide'
  | 'shard'
  | 'show-shard-distribution';

const MIN_HIDE_INDEX_SERVER_VERSION = '4.4.0';

const serverSupportsHideIndex = (serverVersion: string) => {
  try {
    return semver.gte(serverVersion, MIN_HIDE_INDEX_SERVER_VERSION);
  } catch (e) {
    return true;
  }
};

const IndexActions: React.FunctionComponent<IndexActionsProps> = ({
  collectionIsSharded,
  index,
  serverVersion,
  onDeleteIndex,
  onHideIndex,
  onUnhideIndex,
  onShardOnIndex,
  onShowShardDistribution,
}) => {
  const indexActions: GroupedItemAction<IndexAction>[] = useMemo(() => {
    const actions: GroupedItemAction<IndexAction>[] = [
      {
        action: 'delete',
        label: `Drop Index ${index.name}`,
        icon: 'Trash',
      },
    ];

    if (serverSupportsHideIndex(serverVersion)) {
      actions.unshift(
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

    if (index.properties?.includes('shardKey')) {
      actions.unshift({
        action: 'show-shard-distribution',
        label: `Show shard distribution`,
        tooltip: `Show shard distribution`,
        icon: 'Dashboard',
      });
    } else {
      actions.unshift({
        action: 'shard',
        label: `${collectionIsSharded ? 'Re-shard' : 'Shard'} Using Index ${
          index.name
        }`,
        tooltip: `${collectionIsSharded ? 'Re-shard' : 'Shard'}`,
        icon: 'MultiLayers',
      });
    }

    return actions;
  }, [index, serverVersion]);

  const onAction = useCallback(
    (action: IndexAction) => {
      if (action === 'delete') {
        onDeleteIndex(index.name);
      } else if (action === 'hide') {
        onHideIndex(index.name);
      } else if (action === 'unhide') {
        onUnhideIndex(index.name);
      } else if (action === 'shard') {
        onShardOnIndex(index.key);
      } else if (action === 'show-shard-distribution') {
        onShowShardDistribution();
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
