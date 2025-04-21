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
import type { BreadcrumbItem } from '@mongodb-js/compass-components';
import type { Signal } from '@mongodb-js/compass-components';
import React, { useMemo } from 'react';
import toNS from 'mongodb-ns';
import { usePreference } from 'compass-preferences-model/provider';
import CollectionHeaderActions from '../collection-header-actions';
import { CollectionBadge } from './badges';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { getConnectionTitle } from '@mongodb-js/connection-info';

const collectionHeaderStyles = css({
  padding: spacing[400],
  paddingTop: spacing[200],
  paddingBottom: 0,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[200],
});

const breadcrumbStyles = css({
  paddingTop: spacing[200],
  paddingBottom: spacing[200],
});

const collectionHeaderLightStyles = css({
  background: palette.white,
});

const collectionHeaderDarkStyles = css({
  backgroundColor: palette.black,
});

const actionsStyles = css({
  flexShrink: 0,
  marginLeft: 'auto',
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
  const {
    openCollectionWorkspace,
    openCollectionsWorkspace,
    openDatabasesWorkspace,
  } = useOpenWorkspace();
  const connectionInfo = useConnectionInfo();
  const connectionId = connectionInfo.id;
  const connectionName = getConnectionTitle(connectionInfo);

  const breadcrumbItems = useMemo(() => {
    return [
      {
        name: connectionName,
        onClick: () => openDatabasesWorkspace(connectionId),
      },
      {
        name: toNS(namespace).database,
        onClick: () =>
          openCollectionsWorkspace(connectionId, toNS(namespace).database),
      },
      // When viewing a view, show the source namespace first
      sourceName && {
        name: toNS(sourceName).collection,
        onClick: () => openCollectionWorkspace(connectionId, sourceName),
      },
      // Show the current namespace
      {
        name: toNS(namespace).collection,
        onClick: () => openCollectionWorkspace(connectionId, namespace),
      },
      // When editing a view, show the view namespace last
      editViewName && {
        name: toNS(editViewName).collection,
        onClick: () => openCollectionWorkspace(connectionId, editViewName),
      },
    ].filter(Boolean) as BreadcrumbItem[];
  }, [
    connectionId,
    connectionName,
    namespace,
    sourceName,
    editViewName,
    openCollectionsWorkspace,
    openCollectionWorkspace,
    openDatabasesWorkspace,
  ]);

  const insights =
    showInsights && sourcePipeline?.length
      ? getInsightsForPipeline(sourcePipeline, isAtlas)
      : [];
  return (
    <div
      className={cx(
        collectionHeaderStyles,
        darkMode ? collectionHeaderDarkStyles : collectionHeaderLightStyles
      )}
      data-testid="collection-header"
    >
      <Breadcrumbs className={breadcrumbStyles} items={breadcrumbItems} />
      {isReadonly && <CollectionBadge type="readonly" />}
      {isTimeSeries && <CollectionBadge type="timeseries" />}
      {isClustered && <CollectionBadge type="clustered" />}
      {isFLE && <CollectionBadge type="fle" />}
      {isReadonly && sourceName && <CollectionBadge type="view" />}
      {!!insights.length && <SignalPopover signals={insights} />}
      <div className={actionsStyles}>
        <CollectionHeaderActions
          editViewName={editViewName}
          isReadonly={isReadonly}
          namespace={namespace}
          sourceName={sourceName}
          sourcePipeline={sourcePipeline}
        />
      </div>
    </div>
  );
};
