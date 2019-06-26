import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import toNS from 'mongodb-ns';
import { TextButton } from 'hadron-react-buttons';

import styles from './collection-header.less';

/**
 * The collection header.
 */
class CollectionHeader extends Component {
  static displayName = 'CollectionHeaderComponent';

  static propTypes = {
    namespace: PropTypes.string.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    statsPlugin: PropTypes.func.isRequired,
    selectOrCreateTab: PropTypes.func.isRequired,
    statsStore: PropTypes.object.isRequired,
    sourceName: PropTypes.string,
    sourceReadonly: PropTypes.bool.isRequired,
    sourceViewOn: PropTypes.string,
    editViewName: PropTypes.string
  };

  modifySource = () => {
    this.props.selectOrCreateTab(
      this.props.sourceName,
      this.props.sourceReadonly,
      this.props.sourceViewOn,
      this.props.namespace
    );
  }

  returnToView = () => {
    this.props.selectOrCreateTab(
      this.props.editViewName,
      true,
      this.props.namespace,
      null,
      this.props.isReadonly,
      this.props.sourceName
    );
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
   * Render the readonly icon if collection is readonly.
   *
   * @returns {Component} The component.
   */
  renderReadonly() {
    if (this.props.isReadonly) {
      return (
        <div className={classnames(styles['collection-header-title-readonly'])}>
          <span className={classnames(styles['collection-header-title-readonly-on'])}>
            (view on: {this.props.sourceName})
          </span>
          {this.renderModifySource()}
          {this.renderReturnToView()}
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
      <div className={classnames(styles['collection-header'])}>
        {this.renderStats()}
        <div className={titleClass}>
          <span className={classnames(styles['collection-header-title-db'])}>
            {database}
          </span>
          <span>.</span>
          <span
            className={collectionClass}
            title={collection}>
            {collection}
          </span>
          {this.renderReadonly()}
        </div>
      </div>
    );
  }
}

export default CollectionHeader;
