const React = require('react');
const PropTypes = require('prop-types');
const {
  Banner,
  BannerVariant,
  ErrorBoundary,
  Tabs,
  Tab,
  TabNavBar,
  WorkspaceContainer,
  css
} = require('@mongodb-js/compass-components');
const { track } =
  require('@mongodb-js/compass-logging').createLoggerAndTelemetry(
    'COMPASS-INSTANCE-UI'
  );
const { createLoggerAndTelemetry } = require('@mongodb-js/compass-logging');

const { default: styles } = require('./instance.module.less');

const { debug } = createLoggerAndTelemetry(
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
        case 'My Queries':
          return process.env.COMPASS_SHOW_YOUR_QUERIES_TAB === 'true';
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
        {/* <TabNavBar
          data-test-id="instance-tabs"
          aria-label="Instance Tabs"
          setSelected={(tabIdx) => {
            onTabClick(tabIdx, this.tabs[tabIdx]);
          }}
          selected={activeTabId}
        />
        <Tabs
          data-test-id="instance-tabs"
          aria-label="Instance Tabs"
          setSelected={(tabIdx) => {
            onTabClick(tabIdx, this.tabs[tabIdx]);
          }}
          selected={activeTabId}
        >
          {filteredTabs.map((tab, idx) => (
            <Tab
              className="test-tab-nav-bar-tab"
              key={`tab-${idx}`}
              name={tab.name}
            />
          ))}
        </Tabs>
        {filteredTabs.map((tab, idx) => idx === activeTabId && (
          <ErrorBoundary
            displayName={tab.displayName}
            key={tab.name}
            onError={(renderingError, errorInfo) => {
              debug('error rendering instance view', tab.name, renderingError, errorInfo);
            }}
          >
            <WorkspaceContainer>
              <tab.component />
            </WorkspaceContainer>
          </ErrorBoundary>
        ))} */}

        <TabNavBar
          data-test-id="instance-tabs"
          aria-label="Instance Tabs"
          tabs={filteredTabs.map((tab) => {
            return tab.name;
          })}
          views={filteredTabs.map((tab) => {
            return (
              <ErrorBoundary
                displayName={tab.displayName}
                key={tab.name}
                onError={(renderingError, errorInfo) => {
                  debug('error rendering instance view', tab.name, renderingError, errorInfo);
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
