import React, { useEffect, useMemo } from 'react';
import {
  Banner,
  BannerVariant,
  ErrorBoundary,
  TabNavBar,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { Role } from 'hadron-app-registry';

const { log, mongoLogId, track } = createLoggerAndTelemetry('COMPASS-INSTANCE');

function trackingIdForTabName({ name }: { name: string }) {
  return name.toLowerCase().replace(/ /g, '_');
}

const errorContainerStyles = css({
  padding: spacing[3],
});

const ERROR_WARNING = 'An error occurred while loading instance info';

const NOT_MASTER_ERROR = 'not master and slaveOk=false';

// We recommend in the connection dialog to switch to these read preferences.
const RECOMMEND_READ_PREF_MSG = `It is recommended to change your read
 preference in the connection dialog to Primary Preferred or Secondary Preferred
 or provide a replica set name for a full topology connection.`;

const instanceComponentContainerSyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  height: '100%',
});

type InstanceComponentProps = {
  status: 'initial' | 'fetching' | 'refreshing' | 'ready' | 'error';
  error: string | null;
  isDataLake: boolean;
  tabs: Role[];
  activeTabId: number;
  onTabClick: (index: number) => void;
};

function InstanceComponent({
  status,
  error,
  isDataLake,
  tabs,
  activeTabId,
  onTabClick,
}: InstanceComponentProps) {
  const filteredTabs = useMemo(() => {
    return tabs.filter((tabRole) => {
      switch (tabRole.name) {
        case 'Performance':
          return !isDataLake;
        default:
          return true;
      }
    });
  }, [isDataLake, tabs]);

  const activeTab = filteredTabs[activeTabId];

  useEffect(() => {
    track('Screen', { name: trackingIdForTabName(activeTab) });
  }, [activeTab]);

  if (status === 'error') {
    if (error?.includes(NOT_MASTER_ERROR)) {
      error = `'${error}': ${RECOMMEND_READ_PREF_MSG}`;
    }

    return (
      <div className={errorContainerStyles}>
        <Banner variant={BannerVariant.Danger}>
          {ERROR_WARNING}: {error}
        </Banner>
      </div>
    );
  }

  if (status === 'ready' || status === 'refreshing') {
    return (
      <div className={instanceComponentContainerSyles}>
        <TabNavBar
          data-testid="instance-tabs"
          aria-label="Instance Tabs"
          tabs={filteredTabs.map((tab) => {
            return tab.name;
          })}
          views={filteredTabs.map((tab) => {
            return (
              <ErrorBoundary
                displayName={tab.name}
                key={tab.name}
                onError={(err, errorInfo) => {
                  log.error(
                    mongoLogId(1001000110),
                    'Instance Workspace',
                    'Rendering instance tab failed',
                    { name: tab.name, error: err.message, errorInfo }
                  );
                }}
              >
                <tab.component />
              </ErrorBoundary>
            );
          })}
          activeTabIndex={activeTabId}
          onTabClicked={onTabClick}
        />
      </div>
    );
  }

  return null;
}

export { InstanceComponent };
