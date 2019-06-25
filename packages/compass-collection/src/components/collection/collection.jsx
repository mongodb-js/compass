import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { TabNavBar } from 'hadron-react-components';
import CollectionHeader from 'components/collection-header';

import styles from './collection.less';

class Collection extends Component {
  static displayName = 'CollectionComponent';

  static propTypes = {
    namespace: PropTypes.string.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    tabs: PropTypes.array.isRequired,
    views: PropTypes.array.isRequired,
    scopedModals: PropTypes.array.isRequired,
    queryHistoryIndexes: PropTypes.array.isRequired,
    statsPlugin: PropTypes.func.isRequired,
    selectOrCreateTab: PropTypes.func.isRequired,
    statsStore: PropTypes.object.isRequired,
    localAppRegistry: PropTypes.object.isRequired,
    activeSubTab: PropTypes.number.isRequired,
    id: PropTypes.string.isRequired,
    sourceName: PropTypes.string,
    sourceReadonly: PropTypes.bool.isRequired,
    sourceViewOn: PropTypes.string,
    editViewName: PropTypes.string,
    changeActiveSubTab: PropTypes.func.isRequired
  };

  onSubTabClicked = (idx, name) => {
    if (this.props.activeSubTab === idx) {
      return;
    }
    if (!this.props.queryHistoryIndexes.includes(idx)) {
      this.props.localAppRegistry.emit('collapse-query-history');
    }
    this.props.localAppRegistry.emit('subtab-changed', name);
    this.props.changeActiveSubTab(idx, this.props.id);
  }

  /**
   * Render the scoped modals.
   *
   * @returns {Array} The modal components.
   */
  renderScopedModals() {
    return this.props.scopedModals.map((modal) => {
      return (
        <modal.component store={modal.store} actions={modal.actions} key={modal.key} />
      );
    });
  }

  /**
   * Render Collection component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles.collection, 'clearfix')}>
        <div className={classnames(styles['collection-container'])}>
          <CollectionHeader
            namespace={this.props.namespace}
            isReadonly={this.props.isReadonly}
            statsPlugin={this.props.statsPlugin}
            statsStore={this.props.statsStore}
            editViewName={this.props.editViewName}
            sourceReadonly={this.props.sourceReadonly}
            sourceViewOn={this.props.sourceViewOn}
            selectOrCreateTab={this.props.selectOrCreateTab}
            sourceName={this.props.sourceName} />
          <TabNavBar
            theme="light"
            tabs={this.props.tabs}
            views={this.props.views}
            mountAllViews
            activeTabIndex={this.props.activeSubTab}
            onTabClicked={this.onSubTabClicked} />
        </div>
        <div className={classnames(styles['collection-modal-container'])}>
          {this.renderScopedModals()}
        </div>
      </div>
    );
  }
}

export default Collection;
