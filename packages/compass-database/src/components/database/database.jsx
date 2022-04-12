import React, { Component } from 'react';
import { ErrorBoundary, TabNavBar } from '@mongodb-js/compass-components';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

import styles from './database.module.less';

const { log, mongoLogId } = createLoggerAndTelemetry('COMPASS-DATABASES');

class Database extends Component {
  static displayName = 'DatabaseComponent';

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
  onTabClicked = (idx) => {
    if (this.state.activeTab === idx) {
      return;
    }
    this.setState({ activeTab: idx });
  }

  /**
   * Setup the instance level tabs.
   */
  setupTabs() {
    const roles = global.hadronApp.appRegistry.getRole('Database.Tab');

    const tabs = [];
    const views = roles.map((role, i) => {
      tabs.push(role.name);
      return (
        <ErrorBoundary
          displayName={role.displayName}
          key={i}
          onError={(error, errorInfo) => {
            log.error(
              mongoLogId(1001000109),
              'Database Workspace',
              'Rendering database tab failed',
              { name: role.name, error: error.message, errorInfo }
            );
          }}
        >
          <role.component />
        </ErrorBoundary>
      );
    });

    this.tabs = tabs;
    this.views = views;
  }

  /**
   * Render Database component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={styles.database}>
        <TabNavBar
          data-test-id="database-tabs"
          aria-label="Database Tabs"
          tabs={this.tabs}
          views={this.views}
          activeTabIndex={this.state.activeTab}
          onTabClicked={this.onTabClicked}
        />
      </div>
    );
  }
}

export default Database;
