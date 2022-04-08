/* eslint-disable jsx-a11y/anchor-is-valid */
import type AppRegistry from 'hadron-app-registry';
import {
  css,
  uiColors,
  withTheme,
  Box,
  spacing,
} from '@mongodb-js/compass-components';
import type { Document } from 'mongodb';
import React, { Component } from 'react';
import toNS from 'mongodb-ns';

import CollectionHeaderActions from '../collection-header-actions';
import ReadOnlyBadge from './read-only-badge';
import TimeSeriesBadge from './time-series-badge';
import ViewBadge from './view-badge';

const collectionHeaderStyles = css({
  paddingTop: spacing[3],
  paddingBottom: '5px',
  minHeight: '64px',
});

const collectionHeaderNamespaceStyles = css({
  display: 'contents',
});

const collectionHeaderTitleStyles = css({
  fontSize: spacing[4],
  fontWeight: 'normal',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: 'flex',
  paddingLeft: spacing[3],
  paddingRight: spacing[3],
  margin: 0,
  lineHeight: `${spacing[5]}px`,
  alignItems: 'center',
});

const collectionHeaderTitleDBLightStyles = css({
  color: uiColors.green.base,
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

const collectionHeaderTitleDBDarkStyles = css({
  color: uiColors.green.light2,
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

const collectionHeaderTitleCollectionLightStyles = css({
  color: uiColors.gray.dark1,
  flexBasis: 'auto',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const collectionHeaderTitleCollectionDarkStyles = css({
  color: uiColors.gray.light1,
  flexBasis: 'auto',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

type CollectionHeaderProps = {
  darkMode?: boolean;
  globalAppRegistry: AppRegistry;
  namespace: string;
  isReadonly: boolean;
  isTimeSeries: boolean;
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
            <Box
              data-test-id="collection-header-title-db"
              className={
                this.props.darkMode
                  ? collectionHeaderTitleDBDarkStyles
                  : collectionHeaderTitleDBLightStyles
              }
              onClick={() => this.handleDBClick(database)}
            >
              {database}
            </Box>
            <span>.</span>
            <span
              data-testid="collection-header-title-collection"
              className={
                this.props.darkMode
                  ? collectionHeaderTitleCollectionDarkStyles
                  : collectionHeaderTitleCollectionLightStyles
              }
            >
              {collection}
            </span>
          </div>
          {this.props.isReadonly && <ReadOnlyBadge />}
          {this.props.isTimeSeries && <TimeSeriesBadge />}
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

export default withTheme(CollectionHeader);
