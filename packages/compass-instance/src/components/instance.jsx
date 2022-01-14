const React = require('react');
const PropTypes = require('prop-types');
const { TabNavBar, UnsafeComponent } = require('hadron-react-components');
const { Banner, BannerVariant } = require('@mongodb-js/compass-components');
const { track } =
  require('@mongodb-js/compass-logging').createLoggerAndTelemetry(
    'COMPASS-INSTANCE-UI'
  );

const { default: styles } = require('./instance.module.less');

function trackingIdForTabName({ name }) {
  return name.toLowerCase().replace(/ /g, '_');
}

const ERROR_WARNING = 'An error occurred while loading instance info';

const NOT_MASTER_ERROR = 'not master and slaveOk=false';

// We recommend in the connection dialog to switch to these read preferences.
const RECOMMEND_READ_PREF_MSG = `It is recommended to change your read
 preference in the connection dialog to Primary Preferred or Secondary Preferred
 or provide a replica set name for a full topology connection.`;

const InstanceComponent = ({ status, error, isDataLake, tabs }) => {
  const [activeTabId, setActiveTabId] = React.useState(0);

  const filteredTabs = React.useMemo(() => {
    return tabs.filter((tabRole) => {
      switch (tabRole.name) {
        case 'Performance':
          return !isDataLake;
        case 'Your Queries':
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

  const onTabClicked = React.useCallback(
    (idx) => {
      setActiveTabId(idx);
    },
    [setActiveTabId]
  );

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
          data-test-id="instance-tabs"
          aria-label="Instance Tabs"
          tabs={filteredTabs.map((tab) => {
            return tab.name;
          })}
          views={filteredTabs.map((tab) => {
            return <UnsafeComponent key={tab.name} component={tab.component} />;
          })}
          activeTabIndex={activeTabId}
          onTabClicked={onTabClicked}
          mountAllViews={false}
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
};

module.exports = { InstanceComponent };
