import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import toNS from 'mongodb-ns';

import styles from './collection-header.less';

/**
 * The collection header.
 */
class CollectionHeader extends Component {
  static displayName = 'CollectionHeaderComponent';

  static propTypes = {
    namespace: PropTypes.string.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    stats: PropTypes.object.isRequired
  };

  /**
   * Render the readonly icon if collection is readonly.
   *
   * @returns {Component} The component.
   */
  renderReadonly() {
    if (this.props.isReadonly) {
      return (
        <span className={classnames(styles['collection-header-title-readonly'])}>
          <i className="fa fa-eye" aria-hidden="true" />
        </span>
      );
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

    return (
      <div className={classnames(styles['collection-header'])}>
        <h1 className={classnames(styles['collection-header-title'])}>
          <span className={classnames(styles['collection-header-title-db'])}>
            {database}
          </span>
          <span>.</span>
          <span
            className={classnames(styles['collection-header-title-collection'])}
            title={collection}>
            {collection}
          </span>
          {this.renderReadonly()}
        </h1>
      </div>
    );
  }
}

export default CollectionHeader;
