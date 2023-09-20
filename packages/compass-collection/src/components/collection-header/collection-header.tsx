import {
  css,
  palette,
  withDarkMode,
  Link,
  spacing,
  H3,
  cx,
  SignalPopover,
  PerformanceSignals,
} from '@mongodb-js/compass-components';
import type { Signal } from '@mongodb-js/compass-components';
import React, { Component } from 'react';
import toNS from 'mongodb-ns';
import { withPreferences } from 'compass-preferences-model';
import CollectionHeaderActions from '../collection-header-actions';
import CollectionStats from '../collection-stats';
import type { CollectionState } from '../../modules/collection-tab';
import { CollectionBadge } from './badges';

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
  darkMode?: boolean;
  showInsights: boolean;
  onSelectDatabaseClick(): void;
  onEditViewClick(): void;
  onReturnToViewClick(): void;
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

class CollectionHeader extends Component<CollectionHeaderProps> {
  onEditViewClicked = (): void => {
    this.props.onEditViewClick();
  };

  onReturnToViewClicked = (): void => {
    this.props.onReturnToViewClick();
  };

  handleDBClick = (): void => {
    this.props.onSelectDatabaseClick();
  };

  /**
   * Render CollectionHeader component.
   *
   * @returns {React.Component} The rendered component.
   */
  render(): React.ReactElement {
    const ns = toNS(this.props.namespace);
    const database = ns.database;
    const collection = ns.collection;
    const insights =
      this.props.showInsights && this.props.sourcePipeline?.length
        ? getInsightsForPipeline(this.props.sourcePipeline, this.props.isAtlas)
        : [];

    return (
      <div
        className={cx(
          collectionHeaderStyles,
          this.props.darkMode
            ? collectionHeaderDarkStyles
            : collectionHeaderLightStyles
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
                this.props.darkMode ? dbLinkDarkStyles : dbLinkLightStyles
              )}
              hideExternalIcon={true}
              onClick={() => this.handleDBClick()}
            >
              <H3
                className={cx(
                  collectionHeaderDBNameStyles,
                  this.props.darkMode ? dbLinkDarkStyles : dbLinkLightStyles
                )}
              >
                {database}
              </H3>
            </Link>
            <H3
              data-testid="collection-header-title-collection"
              className={cx(
                collectionHeaderCollectionStyles,
                this.props.darkMode
                  ? collectionHeaderTitleCollectionDarkStyles
                  : collectionHeaderTitleCollectionLightStyles
              )}
            >
              {`.${collection}`}
            </H3>
          </div>
          {this.props.isReadonly && <CollectionBadge type="readonly" />}
          {this.props.isTimeSeries && <CollectionBadge type="timeseries" />}
          {this.props.isClustered && <CollectionBadge type="clustered" />}
          {this.props.isFLE && <CollectionBadge type="fle" />}
          {this.props.isReadonly && this.props.sourceName && (
            <CollectionBadge type="view" />
          )}
          {!!insights.length && <SignalPopover signals={insights} />}
          <CollectionHeaderActions
            editViewName={this.props.editViewName}
            isReadonly={this.props.isReadonly}
            onEditViewClicked={this.onEditViewClicked}
            onReturnToViewClicked={this.onReturnToViewClicked}
            sourceName={this.props.sourceName}
          />
        </div>
        {!this.props.isReadonly && !this.props.editViewName && (
          <CollectionStats
            isTimeSeries={this.props.isTimeSeries}
            stats={this.props.stats}
          />
        )}
      </div>
    );
  }
}

export default withPreferences(
  withDarkMode(CollectionHeader),
  ['showInsights'],
  React
);
