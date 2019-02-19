import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ipc from 'hadron-ipc';

import { TOOLTIP_IDS } from 'constants/sidebar-constants';
import SidebarCollection from 'components/sidebar-collection';

class SidebarDatabase extends PureComponent {
  static displayName = 'SidebarDatabase';
  static propTypes = {
    _id: PropTypes.string.isRequired,
    activeNamespace: PropTypes.string.isRequired,
    collections: PropTypes.array.isRequired,
    expanded: PropTypes.bool.isRequired,
    style: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired,
    isWritable: PropTypes.bool.isRequired,
    description: PropTypes.string.isRequired
  };

  constructor(props) {
    super(props);
    const appRegistry = global.hadronApp.appRegistry;
    this.CollectionStore = appRegistry.getStore('App.CollectionStore');
    this.NamespaceStore = appRegistry.getStore('App.NamespaceStore');
  }

  getCollectionComponents() {
    if (this.props.expanded) {
      return this.props.collections.map(c => {
        const props = {
          _id: c._id,
          database: c.database,
          capped: c.capped,
          power_of_two: c.power_of_two,
          readonly: c.readonly,
          activeNamespace: this.props.activeNamespace,
          isWritable: this.props.isWritable,
          description: this.props.description
        };

        return (
          <SidebarCollection key={c._id} {...props} />
        );
      });
    }
  }

  getArrowIconClasses() {
    return 'mms-icon-right-arrow compass-sidebar-icon compass-sidebar-icon-expand' +
      (this.props.expanded ? ' fa fa-rotate-90' : '');
  }

  handleDBClick(db) {
    if (this.NamespaceStore.ns !== db) {
      this.CollectionStore.setCollection({});
      this.NamespaceStore.ns = db;
      ipc.call('window:hide-collection-submenu');
    }
  }

  handleArrowClick() {
    if (this.props.onClick) {
      this.props.onClick(this.props._id);
    }
  }

  handleCreateCollectionClick(isWritable) {
    if (isWritable) {
      const databaseName = this.props._id;
      global.hadronApp.appRegistry.emit('open-create-collection', databaseName);
    }
  }

  handleDropDBClick(isWritable) {
    if (isWritable) {
      const databaseName = this.props._id;
      global.hadronApp.appRegistry.emit('open-drop-database', databaseName);
    }
  }

  isReadonlyDistro() {
    return process.env.HADRON_READONLY === 'true';
  }

  renderCreateCollectionButton() {
    if (!this.isReadonlyDistro()) {
      const createTooltipText = this.state.isWritable ?
        'Create collection' :
        this.state.description;
      const createTooltipOptions = {
        'data-for': TOOLTIP_IDS.CREATE_COLLECTION,
        'data-effect': 'solid',
        'data-offset': "{'bottom': 10, 'left': -8}",
        'data-tip': createTooltipText
      };
      let createClassName = 'mms-icon-add-circle compass-sidebar-icon compass-sidebar-icon-create-collection';
      if (!this.state.isWritable) {
        createClassName += ' compass-sidebar-icon-is-disabled';
      }
      return (
        <i
          className={createClassName}
          onClick={this.handleCreateCollectionClick.bind(this, this.state.isWritable)}
          {...createTooltipOptions} />
      );
    }
  }

  renderDropDatabaseButton() {
    if (!this.isReadonlyDistro()) {
      const dropTooltipText = this.state.isWritable ?
        'Drop database' :
        'Drop database is not available on a secondary node';  // TODO: Arbiter/recovering/etc
      const dropTooltipOptions = {
        'data-for': TOOLTIP_IDS.DROP_DATABASE,
        'data-effect': 'solid',
        'data-offset': "{'bottom': 10, 'left': -5}",
        'data-tip': dropTooltipText
      };
      let dropClassName = 'compass-sidebar-icon compass-sidebar-icon-drop-database fa fa-trash-o';
      if (!this.state.isWritable) {
        dropClassName += ' compass-sidebar-icon-is-disabled';
      }
      return (
        <i
          className={dropClassName}
          onClick={this.handleDropDBClick.bind(this, this.state.isWritable)}
          {...dropTooltipOptions} />
      );
    }
  }

  render() {
    let headerClassName = 'compass-sidebar-item-header compass-sidebar-item-header-is-expandable compass-sidebar-item-header-is-actionable';
    if (this.props.activeNamespace === this.props._id) {
      headerClassName += ' compass-sidebar-item-header-is-active';
    }
    return (
      <div className="compass-sidebar-item compass-sidebar-item-is-top-level" style={this.props.style}>
        <div className={headerClassName}>
          <div className="compass-sidebar-item-header-actions compass-sidebar-item-header-actions-expand">
            <i onClick={this.handleArrowClick.bind(this)} className={this.getArrowIconClasses()} />
          </div>
          <div
            onClick={this.handleDBClick.bind(this, this.props._id)}
            className="compass-sidebar-item-header-title" title={this.props._id}
            data-test-id="sidebar-database">
            {this.props._id}
          </div>
          <div className="compass-sidebar-item-header-actions compass-sidebar-item-header-actions-ddl">
            {this.renderCreateCollectionButton()}
            {this.renderDropDatabaseButton()}
          </div>
        </div>
        <div className="compass-sidebar-item-content">
          {this.getCollectionComponents.call(this)}
        </div>
      </div>
    );
  }
}

export default SidebarDatabase;

