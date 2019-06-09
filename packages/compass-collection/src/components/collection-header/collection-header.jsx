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
    statsStore: PropTypes.object.isRequired,
    sourceName: PropTypes.string
  };

  onModifySource = () => {
    // this.props.modifySource(sourceName);
  }

  /**
   * Render the readonly icon if collection is readonly.
   *
   * @returns {Component} The component.
   */
  renderReadonly() {
    if (this.props.isReadonly) {
      const modifyClass = classnames({
        [styles['collection-header-title-readonly-modify-button']]: true,
        'btn': true,
        'btn-default': true,
        'btn-xs': true
      });
      return (
        <div className={classnames(styles['collection-header-title-readonly'])}>
          <span className={classnames(styles['collection-header-title-readonly-on'])}>
            (on: {this.props.sourceName})
          </span>
          <span className={classnames(styles['collection-header-title-readonly-modify'])}>
            <TextButton
              text="Modify Source"
              title="Modify View Source"
              clickHandler={this.onModifySource}
              className={modifyClass} />
          </span>
          <span className={classnames(styles['collection-header-title-readonly-indicator'])}>
            <i className="fa fa-eye" aria-hidden="true" />
            Read Only
          </span>
        </div>
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
