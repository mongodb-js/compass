const React = require('react');
const PropTypes = require('prop-types');
const {
  Banner,
  BannerVariant,
  ErrorBoundary,
  TabNavBar
} = require('@mongodb-js/compass-components');
const { track } =
  require('@mongodb-js/compass-logging').createLoggerAndTelemetry(
    'COMPASS-INSTANCE-UI'
  );
const { createLoggerAndTelemetry } = require('@mongodb-js/compass-logging');

const { default: styles } = require('./instance.module.less');

const { log, mongoLogId } = createLoggerAndTelemetry(
  'mongodb-compass:compass-collection:context'
);

function trackingIdForTabName({ name }) {
  return name.toLowerCase().replace(/ /g, '_');
}

const ERROR_WARNING = 'An error occurred while loading instance info';

const NOT_MASTER_ERROR = 'not master and slaveOk=false';

// We recommend in the connection dialog to switch to these read preferences.
const RECOMMEND_READ_PREF_MSG = `It is recommended to change your read
 preference in the connection dialog to Primary Preferred or Secondary Preferred
 or provide a replica set name for a full topology connection.`;

const InstanceComponent = ({
  status,
  error,
  isDataLake,
  tabs,
  activeTabId,
  onTabClick,
}) => {
  const filteredTabs = React.useMemo(() => {
    return tabs.filter((tabRole) => {
      switch (tabRole.name) {
        case 'Performance':
          return !isDataLake;
        default:
          return true;
      }
    });
  }, [isDataLake]);

  const activeTab = filteredTabs[activeTabId];

  React.useEffect(() => {
    track('Screen', { name: trackingIdForTabName(activeTab) });
  }, [activeTab]);

  if (status === 'error') {
    if (error.includes(NOT_MASTER_ERROR)) {
      error = `'${error}': ${RECOMMEND_READ_PREF_MSG}`;
    }

    return (
      <div className={styles['instance-error']}>
        <Banner variant={BannerVariant.Danger}>
          {ERROR_WARNING}: {error}
        </Banner>
      </div>
    );
  }

  if (status === 'ready' || status === 'refreshing') {
    return (
      <div className="rtss">
        <TabNavBar
          data-testid="instance-tabs"
          aria-label="Instance Tabs"
          tabs={filteredTabs.map((tab) => {
            return tab.name;
          })}
          views={filteredTabs.map((tab) => {
            return (
              <ErrorBoundary
                displayName={tab.displayName}
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
};

InstanceComponent.propTypes = {
  status: PropTypes.string.isRequired,
  error: PropTypes.string,
  isDataLake: PropTypes.bool.isRequired,
  tabs: PropTypes.array.isRequired,
  activeTabId: PropTypes.number.isRequired,
  onTabClick: PropTypes.func.isRequired,
};

module.exports = { InstanceComponent };
