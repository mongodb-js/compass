import React, { Component } from 'react';
import PropTypes from 'prop-types';
import toNS from 'mongodb-ns';
import Button, { Size as ButtonSize } from '@leafygreen-ui/button';

import ReadOnlyBadge from './read-only-badge';
import TimeSeriesBadge from './time-series-badge';
import ViewBadge from './view-badge';
import ViewInformation from './view-information';

import styles from './collection-header.less';

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

  modifySource = () => {
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

  returnToView = () => {
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
   * Render the modify source button.
   *
   * @returns {Component} The component.
   */
  renderModifySource() {
    return (
      <Button
        size={ButtonSize.XSmall}
        onClick={this.modifySource}
        id="modify-source"
      >EDIT VIEW</Button>
    );
  }

  /**
   * Return to view button.
   *
   * @returns {Component} The component.
   */
  renderReturnToView() {
    return (
      <Button
        className={styles['collection-header-title-return-to-view']}
        size={ButtonSize.XSmall}
        onClick={this.returnToView}
      >&lt; Return to View</Button>
    );
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
          <div className={styles['collection-header-right']}>
            {this.props.isReadonly && this.props.sourceName && (
              <ViewInformation sourceName={this.props.sourceName} />
            )}
            {this.props.isReadonly && this.props.sourceName && !this.props.editViewName && this.renderModifySource()}
            {this.props.editViewName && this.renderReturnToView()}
          </div>
        </div>
      </div>
    );
  }
}

export default CollectionHeader;
