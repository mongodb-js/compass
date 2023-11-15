import React, { useCallback, useEffect } from 'react';
import {
  Banner,
  BannerVariant,
  ErrorBoundary,
  TabNavBar,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { useLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import type { InstanceTab } from './instance-tabs-provider';
import { useInstanceTabs } from './instance-tabs-provider';
import type { MongoDBInstance } from 'mongodb-instance-model';

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
  activeTabName: string | null;
  onTabClick: (name: string) => void;
  isDataLake: boolean;
  instanceInfoLoadingStatus: MongoDBInstance['status'];
  instanceInfoLoadingError: string | null;
};

const InstanceComponent: React.FunctionComponent<InstanceComponentProps> = ({
  activeTabName,
  onTabClick,
  isDataLake,
  instanceInfoLoadingStatus,
  instanceInfoLoadingError,
}) => {
  const { track, log, mongoLogId } = useLoggerAndTelemetry('COMPASS-INSTANCE');
  const filterTabByName = useCallback(
    (tab: InstanceTab) => {
      switch (tab.name) {
        case 'Performance':
          return !isDataLake;
        default:
          return true;
      }
    },
    [isDataLake]
  );
  const [tabs, activeTabIndex] = useInstanceTabs(
    activeTabName,
    filterTabByName
  );

  const activeTab = tabs[activeTabIndex];

  useEffect(() => {
    if (activeTab) {
      track('Screen', { name: trackingIdForTabName(activeTab) });
    }
  }, [activeTab, track]);

  if (instanceInfoLoadingStatus === 'error') {
    if (instanceInfoLoadingError?.includes(NOT_MASTER_ERROR)) {
      instanceInfoLoadingError = `'${instanceInfoLoadingError}': ${RECOMMEND_READ_PREF_MSG}`;
    }

    return (
      <div className={errorContainerStyles}>
        <Banner variant={BannerVariant.Danger}>
          {ERROR_WARNING}: {instanceInfoLoadingError}
        </Banner>
      </div>
    );
  }

  if (
    instanceInfoLoadingStatus === 'ready' ||
    instanceInfoLoadingStatus === 'refreshing'
  ) {
    return (
      <div className={instanceComponentContainerSyles}>
        <TabNavBar
          data-testid="instance-tabs"
          aria-label="Instance Tabs"
          tabs={tabs.map((tab) => {
            return tab.name;
          })}
          views={tabs.map((tab) => {
            return (
              <ErrorBoundary
                displayName={tab.name}
                key={tab.name}
                onError={(err, errorInfo) => {
                  log.error(
                    mongoLogId(1_001_000_110),
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
          activeTabIndex={activeTabIndex}
          onTabClicked={(idx) => {
            onTabClick(tabs[idx].name);
          }}
        />
      </div>
    );
  }

  return null;
};

export { InstanceComponent };
