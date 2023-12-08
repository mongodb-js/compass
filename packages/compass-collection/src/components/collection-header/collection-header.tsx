import {
  css,
  palette,
  Link,
  spacing,
  H3,
  cx,
  SignalPopover,
  PerformanceSignals,
  useDarkMode,
} from '@mongodb-js/compass-components';
import type { Signal } from '@mongodb-js/compass-components';
import React from 'react';
import toNS from 'mongodb-ns';
import { usePreference } from 'compass-preferences-model';
import CollectionHeaderActions from '../collection-header-actions';
import CollectionStats from '../collection-stats';
import type { CollectionState } from '../../modules/collection-tab';
import { CollectionBadge } from './badges';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import { connect } from 'react-redux';

const collectionHeaderStyles = css({
  paddingTop: spacing[3],
  paddingBottom: spacing[1],
  height: +spacing[6] + +spacing[2],
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const collectionHeaderTitleStyles = css({
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  padding: `0 ${String(spacing[3])}px`,
  margin: 0,
  overflow: 'hidden',
  gap: spacing[2],
});

const collectionHeaderDBLinkStyles = css({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  cursor: 'pointer',
  textDecoration: 'none',
  '&:hover,&:focus': {
    textDecoration: 'underline',
  },
  backgroundColor: 'transparent',
  border: 'none',
  display: 'inline-block',
  padding: 0,
});

const collectionHeaderNamespaceStyles = css({
  backgroundColor: 'transparent',
  border: 'none',
  display: 'flex',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
});

const collectionHeaderDBNameStyles = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const dbLinkLightStyles = css({
  color: palette.green.dark2,
});

const dbLinkDarkStyles = css({
  color: palette.green.base,
});

const collectionHeaderCollectionStyles = css({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const collectionHeaderLightStyles = css({
  background: palette.white,
});

const collectionHeaderDarkStyles = css({
  backgroundColor: palette.black,
});

const collectionHeaderTitleCollectionLightStyles = css({
  color: palette.gray.dark1,
});

const collectionHeaderTitleCollectionDarkStyles = css({
  color: palette.gray.light1,
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
  stats: CollectionState['stats'];
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
  stats,
}) => {
  const darkMode = useDarkMode();
  const showInsights = usePreference('showInsights', React);
  const { openCollectionsWorkspace, openCollectionWorkspace } =
    useOpenWorkspace();

  const ns = toNS(namespace);
  const database = ns.database;
  const collection = ns.collection;
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
      <div
        title={`${database}.${collection}`}
        className={collectionHeaderTitleStyles}
        data-testid="collection-header-title"
      >
        <div
          data-testid="collection-header-namespace"
          className={collectionHeaderNamespaceStyles}
        >
          <Link
            data-testid="collection-header-title-db"
            as="button"
            className={cx(
              collectionHeaderDBLinkStyles,
              darkMode ? dbLinkDarkStyles : dbLinkLightStyles
            )}
            hideExternalIcon={true}
            onClick={() => {
              openCollectionsWorkspace(ns.database);
            }}
          >
            <H3
              className={cx(
                collectionHeaderDBNameStyles,
                darkMode ? dbLinkDarkStyles : dbLinkLightStyles
              )}
            >
              {database}
            </H3>
          </Link>
          <H3
            data-testid="collection-header-title-collection"
            className={cx(
              collectionHeaderCollectionStyles,
              darkMode
                ? collectionHeaderTitleCollectionDarkStyles
                : collectionHeaderTitleCollectionLightStyles
            )}
          >
            {`.${collection}`}
          </H3>
        </div>
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
            if (sourceName) {
              openCollectionWorkspace(sourceName, {
                initialPipeline: sourcePipeline,
                editViewName: namespace,
              });
            }
          }}
          onReturnToViewClicked={() => {
            if (editViewName) {
              openCollectionWorkspace(editViewName);
            }
          }}
          sourceName={sourceName}
        />
      </div>
      {!isReadonly && !editViewName && (
        <CollectionStats isTimeSeries={isTimeSeries} stats={stats} />
      )}
    </div>
  );
};

const ConnectedCollectionHeader = connect((state: CollectionState) => {
  return {
    stats: state.stats,
  };
})(CollectionHeader);

export default ConnectedCollectionHeader;
