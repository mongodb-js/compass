import React, { useState, useRef, useCallback } from 'react';
import { ErrorBoundary, TabNavBar, css } from '@mongodb-js/compass-components';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type AppRegistry from 'hadron-app-registry';

const { log, mongoLogId } = createLoggerAndTelemetry('COMPASS-DATABASES');

const databaseStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  height: '100%',
});

function Database() {
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

  const roles = useRef(
    ((global as any).hadronApp?.appRegistry as AppRegistry).getRole(
      'Database.Tab'
    ) || []
  );
  const tabs = useRef(roles.current.map((role) => role.name));
  const views = useRef(
    roles.current.map((role, i) => (
      <ErrorBoundary
        displayName={role.name}
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
    ))
  );

  return (
    <div className={databaseStyles}>
      <TabNavBar
        data-testid="database-tabs"
        aria-label="Database Tabs"
        tabs={tabs.current}
        views={views.current}
        activeTabIndex={activeTab}
        onTabClicked={onTabClicked}
      />
    </div>
  );
}

export { Database };
