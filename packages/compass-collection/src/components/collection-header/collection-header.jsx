import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import toNS from 'mongodb-ns';
import { TextButton } from 'hadron-react-buttons';

import styles from './collection-header.less';

class CollectionHeader extends Component {
  static displayName = 'CollectionHeaderComponent';

  static propTypes = {
    globalAppRegistry: PropTypes.func.isRequired,
    namespace: PropTypes.string.isRequired,
    isReadonly: PropTypes.bool.isRequired,
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
    this.props.selectOrCreateTab(
      this.props.sourceName,
      this.props.sourceReadonly,
      this.props.sourceViewOn,
      this.props.namespace,
      false,
      null,
      this.props.pipeline
    );
  }

  returnToView = () => {
    this.props.selectOrCreateTab(
      this.props.editViewName,
      true,
      this.props.namespace,
      null,
      this.props.isReadonly,
      this.props.sourceName,
      this.props.pipeline
    );
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
    if (!this.props.editViewName) {
      return (
        <span className={classnames(styles['collection-header-title-readonly-modify'])}>
          <TextButton
            id="modify-source"
            className="btn btn-default btn-xs"
            text="Modify Source"
            clickHandler={this.modifySource} />
        </span>
      );
    }
  }

  /**
   * Renders view information if the collection is a view.
   *
   * @returns {Component} The component.
   */
  renderViewInformation() {
    if (this.props.sourceName) {
      return (
        <div>
          <span
            className={classnames(styles['collection-header-title-readonly-on'])}
            title={this.props.sourceName}>
            (view on: {this.props.sourceName})
          </span>
          {this.renderModifySource()}
          {this.renderReturnToView()}
        </div>
      );
    }
  }

  /**
   * Render the readonly icon if collection is readonly.
   *
   * @returns {Component} The component.
   */
  renderReadonly() {
    if (this.props.isReadonly) {
      return (
        <div className={classnames(styles['collection-header-title-readonly'])}>
          {this.renderViewInformation()}
          <span className={classnames(styles['collection-header-title-readonly-indicator'])}>
            <i className="fa fa-eye" aria-hidden="true" />
            Read Only
          </span>
        </div>
      );
    }
    return this.renderReturnToView();
  }

  /**
   * If we are modifying a source pipeline, then render the return to view button.
   *
   * @returns {Component} The component.
   */
  renderReturnToView() {
    if (this.props.editViewName) {
      return (
        <span className={classnames(styles['collection-header-title-return'])}>
          <TextButton
            id="return-to-view"
            className="btn btn-default btn-xs"
            text="< Return To View"
            clickHandler={this.returnToView} />
        </span>
      );
    }
  }

  /**
   * Render the stats.
   *
   * @returns {Component} The component.
   */
  renderStats() {
    if (!this.props.isReadonly) {
      return (<this.props.statsPlugin store={this.props.statsStore} />);
    }
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

    const titleClass = classnames({
      [styles['collection-header-title']]: true,
      [styles['collection-header-title-is-writable']]: !this.props.isReadonly
    });

    const collectionClass = classnames({
      [styles['collection-header-title-collection']]: true,
      [styles['collection-header-title-collection-is-writable']]: !this.props.isReadonly
    });

    return (
      <div className={styles['collection-header']}>
        {this.renderStats()}
        <div className={titleClass} title={`${database}.${collection}`}>
          <a
            className={styles['collection-header-title-db']}
            onClick={() => this.handleDBClick(database)}
          >
            {database}
          </a>
          <span>.</span>
          <span className={collectionClass}>
            {collection}
          </span>
          {this.renderReadonly()}
        </div>
      </div>
    );
  }
}

export default CollectionHeader;
