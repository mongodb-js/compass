import React, { useState, useCallback, useMemo } from 'react';
import { ErrorBoundary, TabNavBar, css } from '@mongodb-js/compass-components';
import { useLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import { useDatabaseTabs } from './database-tabs-provider';

const databaseStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  height: '100%',
});

export function Database() {
  const { log, mongoLogId } = useLoggerAndTelemetry('COMPASS-DATABASES');
  const [activeTab, setActiveTab] = useState(0);

  const onTabClicked = useCallback(
    (index: number) => {
      if (activeTab === index) {
        return;
      }
      setActiveTab(index);
    },
    [activeTab]
  );

  const tabs = useDatabaseTabs();

  const tabNames = useMemo(() => tabs.map((tab) => tab.name), [tabs]);
  const views = useMemo(
    () =>
      tabs.map((tab, i) => (
        <ErrorBoundary
          displayName={tab.name}
          key={i}
          onError={(error, errorInfo) => {
            log.error(
              mongoLogId(1001000109),
              'Database Workspace',
              'Rendering database tab failed',
              { name: tab.name, error: error.message, errorInfo }
            );
          }}
        >
          <tab.component />
        </ErrorBoundary>
      )),
    [tabs, log, mongoLogId]
  );

  return (
    <div className={databaseStyles}>
      <TabNavBar
        data-testid="database-tabs"
        aria-label="Database Tabs"
        tabs={tabNames}
        views={views}
        activeTabIndex={activeTab}
        onTabClicked={onTabClicked}
      />
    </div>
  );
}
