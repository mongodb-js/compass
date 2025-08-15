import semver from 'semver';
import React, { useCallback, useMemo } from 'react';
import type { GroupedItemAction } from '@mongodb-js/compass-components';
import {
  css,
  ItemActionGroup,
  SpinLoader,
  spacing,
  Body,
} from '@mongodb-js/compass-components';

const styles = css({
  // Align actions with the end of the table
  justifyContent: 'flex-end',
});

const combinedContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
  minWidth: spacing[800],
  justifyContent: 'flex-end',
});

const progressTextStyles = css({
  fontSize: '12px',
  fontWeight: 'normal',
});

type Index = {
  name: string;
  extra?: {
    hidden?: boolean;
  };
  status?: 'inprogress' | 'ready' | 'failed';
  progressPercentage?: number;
};

type IndexActionsProps = {
  index: Index;
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
  } catch {
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
    const progressPercentage = index.progressPercentage ?? 0;

    if (progressPercentage < 100 && progressPercentage > 0) {
      // partially built
      actions.push({
        action: 'delete',
        label: `Cancel Index ${index.name}`,
        icon: 'XWithCircle',
        variant: 'destructive',
      });
    } else {
      // completed
      if (serverSupportsHideIndex(serverVersion)) {
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

  const progressPercentage = index.progressPercentage ?? 0;
  if (
    index.status !== 'failed' &&
    progressPercentage < 100 &&
    progressPercentage > 0
  ) {
    return (
      <div
        className={combinedContainerStyles}
        data-testid="index-building-spinner"
      >
        <Body className={progressTextStyles}>
          Building... {progressPercentage | 0}%
        </Body>
        <SpinLoader size={16} title="Index build in progress" />
        <ItemActionGroup<IndexAction>
          data-testid="index-actions"
          actions={indexActions}
          onAction={onAction}
        />
      </div>
    );
  }

  return (
    <ItemActionGroup<IndexAction>
      data-testid="index-actions"
      className={styles}
      actions={indexActions}
      onAction={onAction}
    />
  );
};

export default IndexActions;
