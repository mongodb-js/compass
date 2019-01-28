import React, { Component } from 'react';
import classnames from 'classnames';
import { TabNavBar, UnsafeComponent } from 'hadron-react-components';

import styles from './collection.less';

class Collection extends Component {
  static displayName = 'CollectionComponent';

  constructor(props) {
    super(props);
    this.state = { activeTab: 0 };
    this.setupTabs();
  }

  /**
   * Handle the tab click.
   *
   * @param {Number} idx - The index of the clicked tab.
   */
  onTabClicked(idx) {
    if (this.state.activeTab === idx) {
      return;
    }
    this.setState({ activeTab: idx });
  }

  /**
   * Setup the instance level tabs.
   */
  setupTabs() {
    const roles = global.hadronApp.appRegistry.getRole('Collection.Tab');

    const tabs = [];
    const views = roles.map((role) => {
      tabs.push(role.name);
      return (
        <UnsafeComponent component={role.component} />
      );
    });

    this.tabs = tabs;
    this.views = views;
  }

  /**
   * Render Collection component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles.collection)}>
        <TabNavBar
          theme="light"
          tabs={this.tabs}
          views={this.views}
          activeTabIndex={this.state.activeTab}
          onTabClicked={this.onTabClicked.bind(this)}
          className="rt-nav" />
      </div>
    );
  }
}

export default Collection;
