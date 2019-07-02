import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import toNS from 'mongodb-ns';

import classnames from 'classnames';
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
    isWritable: PropTypes.bool.isRequired,
    description: PropTypes.string.isRequired,
    view_on: PropTypes.any, // undefined or string if view
    sourcePipeline: PropTypes.array,
    pipeline: PropTypes.any, // undefined or array if view
    collections: PropTypes.array.isRequired,
    type: PropTypes.oneOf(['collection', 'view']),
    isDataLake: PropTypes.bool.isRequired
  };

  /**
   * Handle drop collection.
   */
  onDrop = () => {
    const databaseName = this.props.database;
    const collectionName = this.getCollectionName();
    global.hadronApp.appRegistry.emit(
      'open-drop-collection',
      databaseName,
      collectionName
    );
  }

  /**
   * Handle duplicate view.
   */
  onDuplicateView = () => {
    global.hadronApp.appRegistry.emit(
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
    this.showCollection('open-namespace-in-new-tab');
  }

  /**
   * Handle selecting modify source from the contextual menu.
   */
  onModifySource = () => {
    this.showCollection('open-namespace-in-new-tab', this.props._id);
  }

  /**
   * Handle clicking on the collection name.
   */
  onClick = () => {
    this.showCollection('select-namespace');
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
   * Get the collection metadata needed for the collection plugin.
   *
   * @param {String} editViewName - The name of the view to edit.
   *
   * @returns {Object} The metadata.
   */
  collectionMetadata(editViewName) {
    const source = this.props.collections.find((coll) => {
      console.log('coll', coll);
      console.log('ns coll', toNS(coll._id).collection);
      console.log('props', this.props);
      return toNS(coll._id).collection === this.props.view_on;
    });
    return {
      namespace: this.props._id,
      isReadonly: this.props.readonly,
      sourceName: source ? `${this.props.database}.${this.props.view_on}` : null,
      isSourceReadonly: source ? source.readonly : false,
      sourceViewOn: source ? `${this.props.database}.${source.view_on}` : null,
      sourcePipeline: this.props.pipeline,
      editViewName: editViewName
    };
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
   * @param {String} editViewSource - The modify source name.
   */
  showCollection(eventName, editViewSource) {
    global.hadronApp.appRegistry.emit(eventName, this.collectionMetadata(editViewSource));
    if (!this.props.isDataLake) {
      const ipc = require('hadron-ipc');
      ipc.call('window:show-collection-submenu');
    }
  }

  /**
   * Render the readonly icon.
   *
   * @returns {Component} The component.
   */
  renderIsReadonly() {
    if (this.props.readonly) {
      return (
        <i
          className={classnames('fa', styles['compass-sidebar-view-icon'])}
          title="Read-only View"
          aria-hidden="true"
          data-test-id="sidebar-collection-is-readonly" />
      );
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
        title="&hellip;"
        className={classnames(styles['compass-sidebar-item-collection-actions'])}
        noCaret
        pullRight
        id="collection-actions">
        <MenuItem eventKey="1" onClick={this.onOpenInNewTab}>Open in New Tab</MenuItem>
        <MenuItem eventKey="2" onClick={this.onDrop} disabled={this.isNotWritable()}>Drop View</MenuItem>
        <MenuItem eventKey="3" onClick={this.onDuplicateView} disabled={this.isNotWritable()}>Duplicate View</MenuItem>
        <MenuItem eventKey="4" onClick={this.onModifySource} disabled={this.isNotWritable()}>Modify Source</MenuItem>
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
        title="&hellip;"
        className={classnames(styles['compass-sidebar-item-collection-actions'])}
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
          className={classnames(styles['compass-sidebar-item-title'])}
          data-test-id="sidebar-collection"
          title={this.props._id}>
          {collectionName}&nbsp;
          {this.renderIsReadonly()}
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
