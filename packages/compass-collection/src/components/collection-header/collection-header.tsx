import type AppRegistry from 'hadron-app-registry';
import {
  css,
  uiColors,
  withTheme,
  Link,
  spacing,
  H3,
  cx,
} from '@mongodb-js/compass-components';
import type { Document } from 'mongodb';
import React, { Component } from 'react';
import toNS from 'mongodb-ns';

import CollectionHeaderActions from '../collection-header-actions';
import ReadOnlyBadge from './read-only-badge';
import TimeSeriesBadge from './time-series-badge';
import ViewBadge from './view-badge';
import CollectionStats from '../collection-stats';
import type { CollectionStatsObject } from '../../modules/stats';
import ClusteredBadge from './clustered-badge';
import FLEBadge from './fle-badge';

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
  alignItems: 'center',
  flex: '1 1 100%',
  padding: `0 ${String(spacing[3])}px`,
  margin: 0,
  width: '100%',
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
  display: 'inline',
  padding: 0,
});

const collectionHeaderDBLinkLightStyles = css({
  color: uiColors.green.base,
});

const collectionHeaderDBLinkDarkStyles = css({
  color: uiColors.green.light2,
});

const collectionHeaderNamespaceStyles = css({
  backgroundColor: 'transparent',
  border: 'none',
  display: 'flex',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const collectionHeaderDBNameStyles = css({
  display: 'flex',
  alignItems: 'center',
});

const collectionHeaderDBNameLightStyles = css({
  color: uiColors.green.base,
});

const collectionHeaderDBNameDarkStyles = css({
  color: uiColors.green.light2,
});

const collectionHeaderCollectionStyles = css({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const collectionHeaderTitleCollectionLightStyles = css({
  color: uiColors.gray.dark1,
});

const collectionHeaderTitleCollectionDarkStyles = css({
  color: uiColors.gray.light1,
});

type CollectionHeaderProps = {
  darkMode?: boolean;
  globalAppRegistry: AppRegistry;
  namespace: string;
  isReadonly: boolean;
  isTimeSeries: boolean;
  isClustered: boolean;
  isFLE: boolean;
  selectOrCreateTab: (options: any) => any;
  sourceName: string;
  sourceReadonly: boolean;
  sourceViewOn?: string;
  editViewName?: string;
  pipeline: Document[];
  stats: CollectionStatsObject;
};

class CollectionHeader extends Component<CollectionHeaderProps> {
  static displayName = 'CollectionHeaderComponent';

  onEditViewClicked = (): void => {
    this.props.selectOrCreateTab({
      namespace: this.props.sourceName,
      isReadonly: this.props.sourceReadonly,
      isTimeSeries: this.props.isTimeSeries,
      isClustered: this.props.isClustered,
      isFLE: this.props.isFLE,
      sourceName: this.props.sourceViewOn,
      editViewName: this.props.namespace,
      sourceReadonly: false,
      sourceViewOn: null,
      sourcePipeline: this.props.pipeline,
    });
  };

  onReturnToViewClicked = (): void => {
    this.props.selectOrCreateTab({
      namespace: this.props.editViewName,
      isReadonly: true,
      isTimeSeries: this.props.isTimeSeries,
      isClustered: this.props.isClustered,
      isFLE: this.props.isFLE,
      sourceName: this.props.namespace,
      editViewName: null,
      sourceReadonly: this.props.isReadonly,
      sourceViewOn: this.props.sourceName,
      sourcePipeline: this.props.pipeline,
    });
  };

  handleDBClick = (db: string): void => {
    this.props.globalAppRegistry.emit('select-database', db);
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

    return (
      <div className={collectionHeaderStyles} data-testid="collection-header">
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
                this.props.darkMode
                  ? collectionHeaderDBLinkDarkStyles
                  : collectionHeaderDBLinkLightStyles
              )}
              hideExternalIcon={true}
              onClick={() => this.handleDBClick(database)}
            >
              <H3
                className={cx(
                  collectionHeaderDBNameStyles,
                  this.props.darkMode
                    ? collectionHeaderDBNameDarkStyles
                    : collectionHeaderDBNameLightStyles
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
          {this.props.isReadonly && <ReadOnlyBadge />}
          {this.props.isTimeSeries && <TimeSeriesBadge />}
          {this.props.isClustered && <ClusteredBadge />}
          {this.props.isFLE && <FLEBadge />}
          {this.props.isReadonly && this.props.sourceName && <ViewBadge />}
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
            {...this.props.stats}
          />
        )}
      </div>
    );
  }
}

export default withTheme(CollectionHeader);
