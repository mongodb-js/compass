import semver from 'semver';
import React, { useCallback, useMemo } from 'react';
import type {
  GroupedItemAction,
  TranslateFn,
} from '@mongodb-js/compass-components';
import {
  css,
  ItemActionGroup,
  SpinLoader,
  Body,
  spacing,
  formatDuration,
  useTranslation,
} from '@mongodb-js/compass-components';
import type {
  RegularIndex,
  InProgressIndex,
} from '../../modules/regular-indexes';

const styles = css({
  // Align actions with the end of the table
  justifyContent: 'flex-end',
});

const buildProgressStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: spacing[200],
});

// Union type for all possible index types
type IndexForActions = RegularIndex | InProgressIndex;

type IndexActionsProps = {
  index: IndexForActions;
  serverVersion?: string; // Optional for in-progress indexes
  onDeleteIndexClick?: (name: string) => void;
  onDeleteFailedIndexClick?: (name: string) => void;
  onHideIndexClick?: (name: string) => void;
  onUnhideIndexClick?: (name: string) => void;
};

type IndexAction = 'delete' | 'hide' | 'unhide';

const MIN_HIDE_INDEX_SERVER_VERSION = '4.4.0';

// Helper: Check if server supports hide/unhide
const serverSupportsHideIndex = (serverVersion: string): boolean => {
  try {
    return semver.gte(serverVersion, MIN_HIDE_INDEX_SERVER_VERSION);
  } catch {
    return true;
  }
};

// Helper: Determine if index is a regular index
const isRegularIndex = (index: IndexForActions): index is RegularIndex => {
  return 'buildProgress' in index && 'type' in index;
};

// Helper: Determine if index is in-progress
const isInProgressIndex = (
  index: IndexForActions
): index is InProgressIndex => {
  return 'status' in index && !('type' in index);
};

// Helper: Get build progress info from any index type
const getBuildProgress = (index: IndexForActions) => {
  // Both RegularIndex and InProgressIndex have buildProgress with the same type
  return index.buildProgress;
};

// Helper: Determine if index is currently building
const isIndexBuilding = (index: IndexForActions): boolean => {
  if (isInProgressIndex(index)) {
    // For in-progress indexes, status is the source of truth
    return index.status === 'creating';
  }
  // Regular indexes: check $indexStats.building or $currentOp.active
  return !!index.building || !!index.buildProgress.currentOp?.active;
};

// Helper: Determine if index can be deleted
const canDeleteIndex = (index: IndexForActions): boolean => {
  if (isInProgressIndex(index)) {
    // In-progress indexes can only be deleted if failed
    return index.status === 'failed';
  }

  // Regular indexes can always be deleted (except _id_ which is filtered out at table level)
  return true;
};

// Helper: Determine if index can be hidden/unhidden
const canToggleVisibility = (
  index: IndexForActions,
  serverVersion?: string
): boolean => {
  if (!serverVersion || !isRegularIndex(index)) {
    return false;
  }

  // Only completed regular indexes can be hidden/unhidden
  return !isIndexBuilding(index) && serverSupportsHideIndex(serverVersion);
};

// Helper: Build actions array based on index state
const buildIndexActions = (
  index: IndexForActions,
  t: TranslateFn,
  serverVersion?: string
): GroupedItemAction<IndexAction>[] => {
  const actions: GroupedItemAction<IndexAction>[] = [];

  if (isIndexBuilding(index)) {
    // Building indexes can only be cancelled
    actions.push({
      action: 'delete',
      label: t('indexes.indexActions.cancelIndex', 'Cancel Index {name}', {
        name: index.name,
      }),
      tooltip: t('indexes.indexActions.cancelIndexTooltip', 'Cancel Index'),
      icon: 'XWithCircle',
      variant: 'destructive',
    });
  } else {
    // Completed or failed indexes

    // Add hide/unhide for completed regular indexes
    if (canToggleVisibility(index, serverVersion) && isRegularIndex(index)) {
      actions.push(
        index.extra?.hidden
          ? {
              action: 'unhide',
              label: t(
                'indexes.indexActions.unhideIndex',
                'Unhide Index {name}',
                {
                  name: index.name,
                }
              ),
              tooltip: t(
                'indexes.indexActions.unhideIndexTooltip',
                'Unhide Index'
              ),
              icon: 'Visibility',
            }
          : {
              action: 'hide',
              label: t('indexes.indexActions.hideIndex', 'Hide Index {name}', {
                name: index.name,
              }),
              tooltip: t('indexes.indexActions.hideIndexTooltip', 'Hide Index'),
              icon: 'VisibilityOff',
            }
      );
    }

    // Add delete action if applicable
    if (canDeleteIndex(index)) {
      actions.push({
        action: 'delete',
        label: t('indexes.indexActions.dropIndex', 'Drop Index {name}', {
          name: index.name,
        }),
        tooltip: t('indexes.indexActions.dropIndexTooltip', 'Drop Index'),
        icon: 'Trash',
      });
    }
  }

  return actions;
};

const IndexActions: React.FunctionComponent<IndexActionsProps> = ({
  index,
  serverVersion,
  onDeleteIndexClick,
  onDeleteFailedIndexClick,
  onHideIndexClick,
  onUnhideIndexClick,
}) => {
  const t = useTranslation();
  const indexActions = useMemo(
    () => buildIndexActions(index, t, serverVersion),
    [index, t, serverVersion]
  );

  const hasActionHandler = useMemo(() => {
    return (
      !!onDeleteIndexClick ||
      !!onDeleteFailedIndexClick ||
      !!onHideIndexClick ||
      !!onUnhideIndexClick
    );
  }, [
    onDeleteFailedIndexClick,
    onDeleteIndexClick,
    onHideIndexClick,
    onUnhideIndexClick,
  ]);

  const onAction = useCallback(
    (action: IndexAction) => {
      if (action === 'delete') {
        if (isInProgressIndex(index) && index.status === 'failed') {
          onDeleteFailedIndexClick?.(index.name);
        } else {
          onDeleteIndexClick?.(index.name);
        }
      } else if (action === 'hide') {
        onHideIndexClick?.(index.name);
      } else if (action === 'unhide') {
        onUnhideIndexClick?.(index.name);
      }
    },
    [
      index,
      onDeleteIndexClick,
      onDeleteFailedIndexClick,
      onHideIndexClick,
      onUnhideIndexClick,
    ]
  );

  const buildProgress = getBuildProgress(index);

  // Show build progress UI for building indexes
  if (isIndexBuilding(index)) {
    // Determine what text to show for build progress
    // Prioritize secsRunning when progress is missing or not meaningful
    const currentOp = buildProgress.currentOp;
    const secsRunning = currentOp?.secsRunning;
    const progress = currentOp?.progress;

    let progressText: string;
    const hasDuration = secsRunning !== undefined;
    if (progress) {
      progressText = t(
        'indexes.indexActions.buildingPercent',
        'Building… {percent}%',
        {
          percent: Math.trunc(progress * 100),
        }
      );
    } else if (hasDuration) {
      progressText = t(
        'indexes.indexActions.buildingFor',
        'Building For… {duration}',
        { duration: formatDuration(secsRunning) }
      );
    } else {
      progressText = t('indexes.indexActions.building', 'Building…');
    }
    return (
      <div className={buildProgressStyles} data-testid="index-building-spinner">
        <Body>{progressText}</Body>
        <SpinLoader
          size={16}
          title={t(
            'indexes.indexActions.buildInProgress',
            'Index build in progress'
          )}
        />
        {hasActionHandler && indexActions.length > 0 ? (
          <ItemActionGroup<IndexAction>
            data-testid="index-actions"
            actions={indexActions}
            onAction={onAction}
          />
        ) : null}
      </div>
    );
  }

  // Standard actions layout for completed/failed indexes
  return hasActionHandler && indexActions.length > 0 ? (
    <ItemActionGroup<IndexAction>
      data-testid="index-actions"
      className={styles}
      actions={indexActions}
      onAction={onAction}
    />
  ) : null;
};

export default IndexActions;
