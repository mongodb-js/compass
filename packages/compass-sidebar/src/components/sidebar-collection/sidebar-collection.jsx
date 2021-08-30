import React, { PureComponent } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import toNS from 'mongodb-ns';

import { collectionMetadata, getSource } from '../../modules/collection';
import CollectionTypeIcon from '../collection-type-icon';

import styles from './sidebar-collection.less';

class SidebarCollection extends PureComponent {
  static displayName = 'SidebarCollection';
  static propTypes = {
    _id: PropTypes.string.isRequired,
    database: PropTypes.string.isRequired,
    capped: PropTypes.bool.isRequired,
    power_of_two: PropTypes.bool.isRequired,
    readonly: PropTypes.bool.isRequired,
    activeNamespace: PropTypes.string.isRequired,
    globalAppRegistryEmit: PropTypes.func.isRequired,
    isWritable: PropTypes.bool.isRequired,
    description: PropTypes.string.isRequired,
    view_on: PropTypes.any, // undefined or string if view
    sourcePipeline: PropTypes.array,
    pipeline: PropTypes.any, // undefined or array if view
    collections: PropTypes.array.isRequired,
    type: PropTypes.string,
    isDataLake: PropTypes.bool.isRequired,
    isTimeSeries: PropTypes.bool
  };

  /**
   * Handle drop collection.
   */
  onDrop = () => {
    if (!this.isNotWritable()) {
      const databaseName = this.props.database;
      const collectionName = this.getCollectionName();
      this.props.globalAppRegistryEmit('open-drop-collection', databaseName, collectionName);
    }
  }

  /**
   * Handle duplicate view.
   */
  onDuplicateView = () => {
    this.props.globalAppRegistryEmit(
      'open-create-view', {
        source: this.props.view_on,
        pipeline: this.props.pipeline,
        duplicate: true
      }
    );
  }

  /**
   * Handle opening a collection in a new tab.
   */
  onOpenInNewTab = () => {
    this.showCollection(
      'open-namespace-in-new-tab',
      this.props,
      this.props.collections
    );
  }

  /**
   * Handle selecting modify source from the contextual menu.
   */
  onModifySource = () => {
    const source = getSource(this.props.view_on, this.props.collections);
    this.showCollection(
      'open-namespace-in-new-tab',
      source,
      this.props.collections,
      this.props._id
    );
  }

  /**
   * Handle clicking on the collection name.
   */
  onClick = () => {
    this.showCollection(
      'select-namespace',
      this.props,
      this.props.collections
    );
  }

  /**
   * Get the collection name.
   *
   * @returns {String} The collection name.
   */
  getCollectionName() {
    return toNS(this.props._id).collection;
  }

  /**
   * Is the distribution readonly?
   *
   * @returns {Boolean} If the distro is readonly.
   */
  isReadonlyDistro() {
    return process.env.HADRON_READONLY === 'true';
  }

  /**
   * Is the collection not writable.
   *
   * @returns {Boolean} If the collection is not writable.
   */
  isNotWritable() {
    return !this.props.isWritable || this.props.isDataLake || this.isReadonlyDistro();
  }

  /**
   * Show the collection.
   *
   * @param {String} eventName - The event name.
   * @param {Object} collection - The collection.
   * @param {Array} collections - Collections.
   * @param {String} editViewSource - The modify source name.
   */
  showCollection(eventName, collection, collections, editViewSource) {
    const metadata = collectionMetadata(collection, collections, this.props.database, editViewSource);
    if (editViewSource) {
      metadata.sourcePipeline = this.props.pipeline;
    }
    this.props.globalAppRegistryEmit(eventName, metadata);
    if (!this.props.isDataLake) {
      const ipc = require('hadron-ipc');
      ipc.call('window:show-collection-submenu');
    }
  }

  /**
   * Render the view contextual menu.
   *
   * @returns {Component} The component.
   */
  renderViewActions() {
    return (
      <DropdownButton
        bsSize="xsmall"
        bsStyle="link"
        title={<i className="fa fa-fw fa-ellipsis-h" />}
        className={styles['compass-sidebar-item-collection-actions']}
        noCaret
        pullRight
        id="collection-actions">
        <MenuItem eventKey="1" onClick={this.onOpenInNewTab}>Open in New Tab</MenuItem>
        <MenuItem eventKey="2" onClick={this.onDrop} disabled={this.isNotWritable()}>Drop View</MenuItem>
        <MenuItem eventKey="3" onClick={this.onDuplicateView} disabled={this.isNotWritable()}>Duplicate View</MenuItem>
        <MenuItem eventKey="4" onClick={this.onModifySource} disabled={this.isNotWritable()}>Modify View</MenuItem>
      </DropdownButton>
    );
  }

  /**
   * Render the collection contextual menu.
   *
   * @returns {Component} The component.
   */
  renderCollectionActions() {
    return (
      <DropdownButton
        bsSize="xsmall"
        bsStyle="link"
        title={<i className="fa fa-fw fa-ellipsis-h" />}
        className={styles['compass-sidebar-item-collection-actions']}
        noCaret
        pullRight
        id="collection-actions">
        <MenuItem eventKey="1" onClick={this.onOpenInNewTab}>Open in New Tab</MenuItem>
        <MenuItem eventKey="2" onClick={this.onDrop} disabled={this.isNotWritable()}>Drop Collection</MenuItem>
      </DropdownButton>
    );
  }

  /**
   * Render the collection item.
   *
   * @returns {Component} The component.
   */
  render() {
    const collectionName = this.getCollectionName();
    const active =
      this.props.activeNamespace === this.props._id
        ? styles['compass-sidebar-item-is-active']
        : '';
    const itemClassName = classnames(
      styles['compass-sidebar-item'],
      styles['compass-sidebar-item-is-actionable'],
      active
    );
    return (
      <div className={itemClassName}>
        <div
          onClick={this.onClick.bind(this)}
          className={styles['compass-sidebar-item-title']}
          data-test-id="sidebar-collection"
          title={this.props._id}
        >
          <CollectionTypeIcon
            collectionType={this.props.type}
          />
          {collectionName}
        </div>
        <div
          className={classnames(
            styles['compass-sidebar-item-actions'],
            styles['compass-sidebar-item-actions-ddl']
          )}>
          {this.props.readonly ? this.renderViewActions() : this.renderCollectionActions()}
        </div>
      </div>
    );
  }
}

export default SidebarCollection;
