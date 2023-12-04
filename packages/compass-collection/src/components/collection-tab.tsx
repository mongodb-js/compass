import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import type { CollectionTabPluginMetadata } from '../modules/collection-tab';
import {
  returnToView,
  selectDatabase,
  type CollectionState,
  editView,
  selectTab,
  renderScopedModals,
  renderTabs,
  createCollectionStoreMetadata,
} from '../modules/collection-tab';
import { css, ErrorBoundary, TabNavBar } from '@mongodb-js/compass-components';
import CollectionHeader from './collection-header';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { useCollectionTabPlugins } from './collection-tab-provider';
import type { CollectionTabOptions } from '../stores/collection-tab';

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

type CollectionTabProps = {
  currentTab: string;
  collectionTabPluginMetadata: CollectionTabPluginMetadata;
  renderScopedModals(): React.ReactElement[];
  renderTabs(): { name: string; component: React.ReactElement }[];
  onTabClick(name: string): void;
};

const CollectionTab: React.FunctionComponent<CollectionTabProps> = ({
  currentTab,
  collectionTabPluginMetadata,
  renderScopedModals,
  renderTabs,
  onTabClick,
}) => {
  const pluginTabs = useCollectionTabPlugins();
  const legacyTabs = renderTabs();
  const tabs = [
    ...legacyTabs,
    ...pluginTabs.map(({ name, component: Component }) => ({
      name,
      component: <Component {...collectionTabPluginMetadata} />,
    })),
  ];
  // TODO(COMPASS-7404): While the legacy tabs and the provider-injected ones exist,
  // we cannot just rely on the HadronRole ordering anymore
  tabs.sort(
    (
      (order) =>
      (a, b): number =>
        order[a.name] - order[b.name]
    )({
      Documents: 0,
      Aggregations: 1,
      Schema: 2,
      Indexes: 3,
      Validation: 4,
    } as Record<string, number>)
  );
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
      collectionTabPluginMetadata: createCollectionStoreMetadata(state),
    };
  },
  {
    renderScopedModals: renderScopedModals,
    renderTabs: renderTabs,
    onTabClick: selectTab,
  }
)(CollectionTab) as React.FunctionComponent<CollectionTabOptions>;

export default ConnectedCollectionTab;
