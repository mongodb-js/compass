/* eslint-disable jsx-a11y/anchor-is-valid */
import type AppRegistry from 'hadron-app-registry';
import { css, uiColors } from '@mongodb-js/compass-components';
import type { Document } from 'mongodb';
import React, { Component } from 'react';
import toNS from 'mongodb-ns';

import CollectionHeaderActions from '../collection-header-actions';
import ReadOnlyBadge from './read-only-badge';
import TimeSeriesBadge from './time-series-badge';
import ViewBadge from './view-badge';
import ClusteredBadge from './clustered-badge';

const collectionHeaderStyles = css({
  paddingTop: '15px',
  paddingBottom: '5px',
  minHeight: '64px',
  background: uiColors.white,
});

const collectionHeaderNamespaceStyles = css({
  display: 'contents',
});

const collectionHeaderTitleStyles = css({
  fontSize: '24px',
  fontWeight: 'normal',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: 'flex',
  paddingLeft: '15px',
  paddingRight: '15px',
  margin: 0,
  lineHeight: '32px',
  alignItems: 'center',
});

const collectionHeaderTitleDBStyles = css({
  color: ' #337ab7',
  flexShrink: 2,
  flexBasis: 'auto',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  textDecoration: 'none',
  '&:hover,&:focus': {
    textDecoration: 'underline',
  },
});

const collectionHeaderTitleCollectionStyles = css({
  flexBasis: 'auto',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

type CollectionHeaderProps = {
  globalAppRegistry: AppRegistry;
  namespace: string;
  isReadonly: boolean;
  isTimeSeries: boolean;
  isClustered: boolean;
  statsPlugin: React.FunctionComponent<{ store: any }>;
  selectOrCreateTab: (options: any) => any;
  statsStore: any;
  sourceName: string;
  sourceReadonly: boolean;
  sourceViewOn?: string;
  editViewName?: string;
  pipeline: Document[];
};

class CollectionHeader extends Component<CollectionHeaderProps> {
  static displayName = 'CollectionHeaderComponent';

  onEditViewClicked = (): void => {
    this.props.selectOrCreateTab({
      namespace: this.props.sourceName,
      isReadonly: this.props.sourceReadonly,
      isTimeSeries: this.props.isTimeSeries,
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
   * Render the stats.
   *
   * @returns {Component} The component.
   */
  renderStats(): React.ReactElement {
    return <this.props.statsPlugin store={this.props.statsStore} />;
  }

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
        {!this.props.isReadonly && this.renderStats()}
        <div
          title={`${database}.${collection}`}
          className={collectionHeaderTitleStyles}
          data-testid="collection-header-title"
        >
          <div
            data-testid="collection-header-namespace"
            className={collectionHeaderNamespaceStyles}
          >
            <a
              data-testid="collection-header-title-db"
              className={collectionHeaderTitleDBStyles}
              onClick={() => this.handleDBClick(database)}
              href="#"
            >
              {database}
            </a>
            <span>.</span>
            <span
              data-testid="collection-header-title-collection"
              className={collectionHeaderTitleCollectionStyles}
            >
              {collection}
            </span>
          </div>
          {this.props.isReadonly && <ReadOnlyBadge />}
          {this.props.isTimeSeries && <TimeSeriesBadge />}
          {this.props.isClustered && <ClusteredBadge />}
          {this.props.isReadonly && this.props.sourceName && <ViewBadge />}
          <CollectionHeaderActions
            editViewName={this.props.editViewName}
            isReadonly={this.props.isReadonly}
            onEditViewClicked={this.onEditViewClicked}
            onReturnToViewClicked={this.onReturnToViewClicked}
            sourceName={this.props.sourceName}
          />
        </div>
      </div>
    );
  }
}

export default CollectionHeader;
