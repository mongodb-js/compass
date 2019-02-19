import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { TOOLTIP_IDS } from 'constants/sidebar-constants';
import ipc from 'hadron-ipc';


class SidebarCollection extends PureComponent {
  static displayName = 'SidebarCollection';
  static propTypes = {
    _id: PropTypes.string.isRequired,
    database: PropTypes.string.isRequired,
    capped: PropTypes.bool.isRequired,
    power_of_two: PropTypes.bool.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    activeNamespace: PropTypes.string.isRequired,
    active: PropTypes.bool.isRequired,
    isWritable: PropTypes.bool.isRequired,
    description: PropTypes.string.isRequired
  };

  constructor() {
    super();
    const appRegistry = global.hadronApp.appRegistry;
    this.handleClick = this.handleClick.bind(this);
    this.CollectionStore = appRegistry.getStore('App.CollectionStore');
    this.NamespaceStore = appRegistry.getStore('App.NamespaceStore');
  }

  getCollectionName() {
    const database = this.props.database;
    const _id = this.props._id;
    return _id.slice(database.length + 1);
  }

  handleClick() {
    if (this.NamespaceStore.ns !== this.props._id) {
      this.CollectionStore.setCollection(this.props);
      ipc.call('window:show-collection-submenu');
    }
  }

  handleDropCollectionClick(isWritable) {
    if (isWritable) {
      const databaseName = this.props.database;
      const collectionName = this.getCollectionName();
      global.hadronApp.appRegistry.emit('open-drop-collection', databaseName, collectionName);
    }
  }

  isReadonlyDistro() {
    return process.env.HADRON_READONLY === 'true';
  }

  renderIsReadonly() {
    if (this.props.isReadonly) {
      return (
        <i className="fa fa-lock" aria-hidden="true" />
      );
    }
  }

  renderDropCollectionButton() {
    if (!this.isReadonlyDistro()) {
      const tooltipText = this.state.isWritable ?
        'Drop collection' :
        this.state.description;
      const tooltipOptions = {
        'data-for': TOOLTIP_IDS.DROP_COLLECTION,
        'data-effect': 'solid',
        'data-offset': "{'bottom': 10, 'left': -5}",
        'data-tip': tooltipText
      };
      let dropClassName = 'compass-sidebar-icon compass-sidebar-icon-drop-collection fa fa-trash-o';
      if (!this.state.isWritable) {
        dropClassName += ' compass-sidebar-icon-is-disabled';
      }
      return (
        <i
          className={dropClassName}
          onClick={this.handleDropCollectionClick.bind(this, this.state.isWritable)}
          {...tooltipOptions} />
      );
    }
  }

  render() {
    const collectionName = this.getCollectionName();
    let itemClassName = 'compass-sidebar-item compass-sidebar-item-is-actionable';
    if (this.props.activeNamespace === this.props._id) {
      itemClassName += ' compass-sidebar-item-is-active';
    }
    return (
      <div className={itemClassName}>
        <div
          onClick={this.handleClick.bind(this)}
          className="compass-sidebar-item-title"
          data-test-id="sidebar-collection"
          title={this.props._id} >
          {collectionName}&nbsp;
          {this.renderIsReadonly()}
        </div>
        <div className="compass-sidebar-item-actions compass-sidebar-item-actions-ddl">
          {this.renderDropCollectionButton()}
        </div>
      </div>
    );
  }
}

export default SidebarCollection;

