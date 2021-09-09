import React, { Component } from 'react';
import PropTypes from 'prop-types';
import toNS from 'mongodb-ns';

import CollectionHeaderActions from '../collection-header-actions';
import ReadOnlyBadge from './read-only-badge';
import TimeSeriesBadge from './time-series-badge';
import ViewBadge from './view-badge';

import styles from './collection-header.module.less';

class CollectionHeader extends Component {
  static displayName = 'CollectionHeaderComponent';

  static propTypes = {
    globalAppRegistry: PropTypes.func.isRequired,
    namespace: PropTypes.string.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    isTimeSeries: PropTypes.bool.isRequired,
    statsPlugin: PropTypes.func.isRequired,
    selectOrCreateTab: PropTypes.func.isRequired,
    statsStore: PropTypes.object.isRequired,
    sourceName: PropTypes.string,
    sourceReadonly: PropTypes.bool.isRequired,
    sourceViewOn: PropTypes.string,
    editViewName: PropTypes.string,
    pipeline: PropTypes.array
  };

  onEditViewClicked = () => {
    this.props.selectOrCreateTab({
      namespace: this.props.sourceName,
      isReadonly: this.props.sourceReadonly,
      isTimeSeries: this.props.isTimeSeries,
      sourceName: this.props.sourceViewOn,
      editViewName: this.props.namespace,
      sourceReadonly: false,
      sourceViewOn: null,
      sourcePipeline: this.props.pipeline
    });
  }

  onReturnToViewClicked = () => {
    this.props.selectOrCreateTab({
      namespace: this.props.editViewName,
      isReadonly: true,
      isTimeSeries: this.props.isTimeSeries,
      sourceName: this.props.namespace,
      editViewName: null,
      sourceReadonly: this.props.isReadonly,
      sourceViewOn: this.props.sourceName,
      sourcePipeline: this.props.pipeline
    });
  }

  handleDBClick = (db) => {
    this.props.globalAppRegistry.emit('select-database', db);
  }

  /**
   * Render the stats.
   *
   * @returns {Component} The component.
   */
  renderStats() {
    return (<this.props.statsPlugin store={this.props.statsStore} />);
  }

  /**
   * Render CollectionHeader component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const ns = toNS(this.props.namespace);
    const database = ns.database;
    const collection = ns.collection;

    return (
      <div className={styles['collection-header']}>
        {!this.props.isReadonly && this.renderStats()}
        <div className={styles['collection-header-title']} title={`${database}.${collection}`}>
          <a
            className={styles['collection-header-title-db']}
            onClick={() => this.handleDBClick(database)}
            href="#"
          >
            {database}
          </a>
          <span>.</span>
          <span className={styles['collection-header-title-collection']}>
            {collection}
          </span>
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

export default CollectionHeader;
