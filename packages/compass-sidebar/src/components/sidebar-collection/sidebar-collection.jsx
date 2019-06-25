import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import { TOOLTIP_IDS } from 'constants/sidebar-constants';
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
    pipeline: PropTypes.any, // undefined or array if view
    collections: PropTypes.array.isRequired,
    type: PropTypes.oneOf(['collection', 'view']),
    isDataLake: PropTypes.bool.isRequired
  };

  constructor(props) {
    super(props);
    this.CollectionStore = global.hadronApp.appRegistry.getStore(
      'App.CollectionStore'
    );
    this.NamespaceStore = global.hadronApp.appRegistry.getStore(
      'App.NamespaceStore'
    );
  }

  onOpenInNewTab() {
    const source = this.props.collections.find((coll) => {
      return toNS(coll._id).collection === this.props.view_on;
    });
    console.log('onOpenInNewTab', this.props, source);
    global.hadronApp.appRegistry.emit(
      'open-namespace-in-new-tab',
      this.props._id,
      this.props.readonly,
      `${this.props.database}.${this.props.view_on}`,
      null,
      source ? source.readonly : false,
      source ? `${this.props.database}.${source.view_on}` : null,
    );
  }

  onDrop() {
    const databaseName = this.props.database;
    const collectionName = this.getCollectionName();
    global.hadronApp.appRegistry.emit(
      'open-drop-collection',
      databaseName,
      collectionName
    );
  }

  onDuplicateView() {
    global.hadronApp.appRegistry.emit(
      'open-create-view', {
        source: this.props.view_on,
        pipeline: this.props.pipeline,
        duplicate: true
      }
    );
  }

  onModifySource() {
    const source = this.props.collections.find((coll) => {
      return toNS(coll._id).collection === this.props.view_on;
    });
    console.log('onModifySource', this.props, source);
    global.hadronApp.appRegistry.emit(
      'open-namespace-in-new-tab',
      `${this.props.database}.${this.props.view_on}`,
      source ? source.readonly : false,
      source ? `${this.props.database}.${source.view_on}` : null,
      this.props._id,
      null,
      null
    );
  }

  getCollectionName() {
    return toNS(this.props._id).collection;
  }

  handleClick() {
    if (this.NamespaceStore.ns !== this.props._id) {
      const source = this.props.collections.find((coll) => {
        return toNS(coll._id).collection === this.props.view_on;
      });
      this.CollectionStore.setCollection({
        _id: this.props._id,
        database: this.props.database,
        capped: this.props.capped,
        power_of_two: this.props.power_of_two,
        readonly: this.props.readonly,
        type: this.props.type,
        view_on: this.props.view_on,
        pipeline: this.props.pipeline,
        activeNamespace: this.props.activeNamespace
      });
      console.log('handleClick', this.props, source);
      global.hadronApp.appRegistry.emit(
        'select-namespace',
        this.props._id,
        this.props.readonly,
        this.props.view_on,
        null,
        source ? source.readonly : false,
        source ? source.view_on : null
      );
      if (!this.props.isDataLake) {
        const ipc = require('hadron-ipc');
        ipc.call('window:show-collection-submenu');
      }
    }
  }

  isReadonlyDistro() {
    return process.env.HADRON_READONLY === 'true';
  }

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
        <MenuItem eventKey="1" onClick={this.onOpenInNewTab.bind(this)}>Open in New Tab</MenuItem>
        <MenuItem eventKey="2" onClick={this.onDrop.bind(this)} disabled={!this.props.isWritable || this.props.isDataLake}>Drop View</MenuItem>
        <MenuItem eventKey="3" onClick={this.onDuplicateView.bind(this)} disabled={!this.props.isWritable}>Duplicate View</MenuItem>
        <MenuItem eventKey="4" onClick={this.onModifySource.bind(this)} disabled={!this.props.isWritable}>Modify Source</MenuItem>
      </DropdownButton>
    );
  }

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
        <MenuItem eventKey="1" onClick={this.onOpenInNewTab.bind(this)}>Open in New Tab</MenuItem>
        <MenuItem eventKey="2" onClick={this.onDrop.bind(this)} disabled={!this.props.isWritable}>Drop Collection</MenuItem>
      </DropdownButton>
    );
  }

  renderDropCollectionButton() {
    if (!this.isReadonlyDistro() && !this.props.isDataLake) {
      const tooltipText = this.props.isWritable
        ? 'Drop collection'
        : this.props.description;
      const tooltipOptions = {
        'data-for': TOOLTIP_IDS.DROP_COLLECTION,
        'data-effect': 'solid',
        'data-offset': "{'bottom': 10, 'left': -5}",
        'data-tip': tooltipText
      };
      const disabled = !this.props.isWritable
        ? styles['compass-sidebar-icon-is-disabled']
        : '';
      const dropClassName = classnames(
        styles['compass-sidebar-icon'],
        styles['compass-sidebar-icon-drop-collection'],
        'fa',
        'fa-trash-o',
        disabled
      );
      return (
        <i
          className={dropClassName}
          data-test-id="compass-sidebar-icon-drop-collection"
          onClick={this.handleDropCollectionClick.bind(
            this,
            this.props.isWritable
          )}
          {...tooltipOptions}
        />
      );
    }
  }

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
          onClick={this.handleClick.bind(this)}
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
