import {
  css,
  palette,
  spacing,
  cx,
  SignalPopover,
  PerformanceSignals,
  useDarkMode,
  Breadcrumbs,
} from '@mongodb-js/compass-components';
import type { Signal } from '@mongodb-js/compass-components';
import React from 'react';
import toNS from 'mongodb-ns';
import { usePreference } from 'compass-preferences-model/provider';
import CollectionHeaderActions from '../collection-header-actions';
import type { CollectionState } from '../../modules/collection-tab';
import { CollectionBadge } from './badges';
import {
  useOpenWorkspace,
  useWorkspaceBreadcrumbs,
} from '@mongodb-js/compass-workspaces/provider';
import { connect } from 'react-redux';

const collectionHeaderStyles = css({
  padding: spacing[3],
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[2],
});

const collectionHeaderLightStyles = css({
  background: palette.white,
});

const collectionHeaderDarkStyles = css({
  backgroundColor: palette.black,
});

type CollectionHeaderProps = {
  namespace: string;
  isReadonly: boolean;
  isTimeSeries: boolean;
  isClustered: boolean;
  isFLE: boolean;
  isAtlas: boolean;
  sourceName?: string;
  editViewName?: string;
  sourcePipeline?: unknown[];
};

const getInsightsForPipeline = (pipeline: any[], isAtlas: boolean) => {
  const insights = new Set<Signal>();
  for (const stage of pipeline) {
    if ('$match' in stage) {
      const stringifiedStageValue = JSON.stringify(stage);
      if (/\$(text|regex)\b/.test(stringifiedStageValue)) {
        insights.add(
          isAtlas
            ? PerformanceSignals.get('atlas-text-regex-usage-in-view')
            : PerformanceSignals.get('non-atlas-text-regex-usage-in-view')
        );
      }
    }

    if ('$lookup' in stage) {
      insights.add(PerformanceSignals.get('lookup-in-view'));
    }
  }

  return Array.from(insights);
};

export const CollectionHeader: React.FunctionComponent<
  CollectionHeaderProps
> = ({
  namespace,
  isReadonly,
  isTimeSeries,
  isClustered,
  isFLE,
  isAtlas,
  sourceName,
  editViewName,
  sourcePipeline,
}) => {
  const darkMode = useDarkMode();
  const showInsights = usePreference('showInsights');
  const { openCollectionWorkspace, openEditViewWorkspace } = useOpenWorkspace();

  const ns = toNS(namespace);
  const database = ns.database;
  const collection = ns.collection;
  const insights =
    showInsights && sourcePipeline?.length
      ? getInsightsForPipeline(sourcePipeline, isAtlas)
      : [];
  const breadcrumbItems = useWorkspaceBreadcrumbs();
  return (
    <div
      title={`${database}.${collection}`}
      className={cx(
        collectionHeaderStyles,
        darkMode ? collectionHeaderDarkStyles : collectionHeaderLightStyles
      )}
      data-testid="collection-header"
    >
      <Breadcrumbs items={breadcrumbItems} />
      {isReadonly && <CollectionBadge type="readonly" />}
      {isTimeSeries && <CollectionBadge type="timeseries" />}
      {isClustered && <CollectionBadge type="clustered" />}
      {isFLE && <CollectionBadge type="fle" />}
      {isReadonly && sourceName && <CollectionBadge type="view" />}
      {!!insights.length && <SignalPopover signals={insights} />}
      <CollectionHeaderActions
        editViewName={editViewName}
        isReadonly={isReadonly}
        onEditViewClicked={() => {
          if (sourceName && sourcePipeline) {
            openEditViewWorkspace(namespace, {
              sourceName,
              sourcePipeline,
            });
          }
        }}
        onReturnToViewClicked={() => {
          if (editViewName) {
            openCollectionWorkspace(editViewName, { sourceName: namespace });
          }
        }}
        sourceName={sourceName}
      />
    </div>
  );
};

const ConnectedCollectionHeader = connect((state: CollectionState) => {
  return {
    stats: state.stats,
  };
})(CollectionHeader);

export default ConnectedCollectionHeader;
