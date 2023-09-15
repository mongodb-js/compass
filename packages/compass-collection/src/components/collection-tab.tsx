import React, { useEffect } from 'react';
import type { Store } from 'redux';
import { connect, Provider } from 'react-redux';
import {
  returnToView,
  selectDatabase,
  type CollectionState,
  editView,
  selectTab,
  renderScopedModals,
  renderTabs,
} from '../modules/collection-tab';
import { css, ErrorBoundary, TabNavBar } from '@mongodb-js/compass-components';
import CollectionHeader from './collection-header';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';

const { log, mongoLogId, track } = createLoggerAndTelemetry(
  'COMPASS-COLLECTION-TAB-UI'
);

function trackingIdForTabName(name: string) {
  return name.toLowerCase().replace(/ /g, '_');
}

const ConnectedCollectionHeader = connect(
  (state: CollectionState) => {
    return {
      ...state.metadata,
      editViewName: state.editViewName,
      stats: state.stats,
    };
  },
  {
    onSelectDatabaseClick: selectDatabase,
    onEditViewClick: editView,
    onReturnToViewClick: returnToView,
  }
)(CollectionHeader);

const collectionStyles = css({
  display: 'flex',
  alignItems: 'stretch',
  height: '100%',
  width: '100%',
});

const collectionContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  height: '100%',
  width: '100%',
});

const collectionModalContainerStyles = css({
  zIndex: 100,
});

const CollectionTab: React.FunctionComponent<{
  currentTab: string;
  renderScopedModals(): React.ReactElement[];
  renderTabs(): { name: string; component: React.ReactElement }[];
  onTabClick(name: string): void;
}> = ({ currentTab, renderScopedModals, renderTabs, onTabClick }) => {
  const tabs = renderTabs();
  const activeTabIndex = tabs.findIndex((tab) => tab.name === currentTab);

  useEffect(() => {
    const activeSubTabName = currentTab
      ? trackingIdForTabName(currentTab)
      : null;

    if (activeSubTabName) {
      track('Screen', {
        name: activeSubTabName,
      });
    }
  }, [currentTab]);

  return (
    <div className={collectionStyles} data-testid="collection">
      <div className={collectionContainerStyles}>
        <ConnectedCollectionHeader></ConnectedCollectionHeader>
        <TabNavBar
          data-testid="collection-tabs"
          aria-label="Collection Tabs"
          tabs={tabs.map((tab) => {
            return tab.name;
          })}
          views={tabs.map((tab) => {
            return (
              <ErrorBoundary
                key={tab.name}
                onError={(error: Error, errorInfo: unknown) => {
                  log.error(
                    mongoLogId(1001000107),
                    'Collection Workspace',
                    'Rendering collection tab failed',
                    { name: tab.name, error: error.stack, errorInfo }
                  );
                }}
              >
                {tab.component}
              </ErrorBoundary>
            );
          })}
          activeTabIndex={activeTabIndex}
          onTabClicked={(id) => {
            onTabClick(tabs[id].name);
          }}
        />
      </div>
      <div className={collectionModalContainerStyles}>
        {renderScopedModals()}
      </div>
    </div>
  );
};

const ConnectedCollectionTab = connect(
  (state: CollectionState) => {
    return {
      currentTab: state.currentTab,
    };
  },
  {
    renderScopedModals: renderScopedModals,
    renderTabs: renderTabs,
    onTabClick: selectTab,
  }
)(CollectionTab);

const CollectionTabPlugin: React.FunctionComponent<{ store: Store }> = ({
  store,
}) => {
  return (
    <Provider store={store}>
      <ConnectedCollectionTab></ConnectedCollectionTab>
    </Provider>
  );
};

export default CollectionTabPlugin;
