import React, { useCallback, useMemo } from 'react';
import type { GroupedItemAction } from '@mongodb-js/compass-components';
import {
  Button,
  ItemActionGroup,
  css,
  cx,
  spacing,
  useTranslation,
} from '@mongodb-js/compass-components';
import type { SearchIndex } from 'mongodb-data-service';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';

type SearchIndexActionContext = 'Search Indexes Drawer Table' | 'Indexes Tab';

type IndexActionsProps = {
  index: SearchIndex;
  context: SearchIndexActionContext;
  onDropIndex: (name: string) => void;
  onEditIndex?: (name: string) => void;
  onRunAggregateIndex?: (name: string) => void;
};

type SearchIndexAction = 'drop' | 'edit';

const actionGroupStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
});

const runAggregateStyles = css({
  // Because leafygreen buttons have transition: all by default and this causes
  // a lag when trying to hide the buttons, because the browser will transition
  // properties like display or visibility
  transitionProperty: 'background-color, box-shadow, border-color',
});

const notQueryableAggregateStyles = css({ visibility: 'hidden' });

const IndexActions: React.FunctionComponent<IndexActionsProps> = ({
  index,
  context,
  onDropIndex,
  onEditIndex,
  onRunAggregateIndex,
}) => {
  const t = useTranslation();
  const indexActions: GroupedItemAction<SearchIndexAction>[] = useMemo(() => {
    const actions: GroupedItemAction<SearchIndexAction>[] = [
      {
        action: 'edit',
        label: t('indexes.searchActions.editIndex', 'Edit Index {name}', {
          name: index.name,
        }),
        tooltip: t('indexes.searchActions.editIndexTooltip', 'Edit Index'),
        icon: 'Edit',
        isDisabled: !onEditIndex,
      },
      {
        action: 'drop',
        label: t('indexes.searchActions.dropIndex', 'Drop Index {name}', {
          name: index.name,
        }),
        tooltip: t('indexes.searchActions.dropIndexTooltip', 'Drop Index'),
        icon: 'Trash',
      },
    ];

    return actions;
  }, [index, onEditIndex, t]);

  const track = useTelemetry();

  const onAction = useCallback(
    (action: SearchIndexAction) => {
      if (action === 'drop') {
        track('Index Drop Action Clicked', {
          context,
          index_type: index.type ?? 'search',
        });
        onDropIndex(index.name);
      } else if (action === 'edit') {
        track('Index Edit Action Clicked', {
          context,
          index_type: index.type ?? 'search',
        });
        onEditIndex?.(index.name);
      }
    },
    [context, onDropIndex, onEditIndex, index, track]
  );

  return (
    <div className={actionGroupStyles}>
      {onRunAggregateIndex && (
        <Button
          data-testid="search-index-actions-aggregate-action"
          className={cx(
            runAggregateStyles,
            !index.queryable && notQueryableAggregateStyles
          )}
          size="xsmall"
          onClick={() => onRunAggregateIndex(index.name)}
        >
          {t('indexes.searchActions.aggregate', 'Aggregate')}
        </Button>
      )}
      <ItemActionGroup<SearchIndexAction>
        data-testid="search-index-actions"
        actions={indexActions}
        onAction={onAction}
      ></ItemActionGroup>
    </div>
  );
};

export default IndexActions;
