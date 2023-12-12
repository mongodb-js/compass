import React, { useEffect } from 'react';
import { connect } from 'react-redux';
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
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { useCollectionTabPlugins } from './collection-tab-provider';
import type { CollectionTabOptions } from '../stores/collection-tab';
import type { CollectionMetadata } from 'mongodb-collection-model';

const { log, mongoLogId, track } = createLoggerAndTelemetry(
  'COMPASS-COLLECTION-TAB-UI'
);

function trackingIdForTabName(name: string) {
  return name.toLowerCase().replace(/ /g, '_');
}

const ConnectedCollectionHeader = connect(
  (state: CollectionState) => {
    return {
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

type CollectionTabProps = CollectionTabOptions & {
  currentTab: string;
  collectionMetadata: CollectionMetadata | null;
  renderScopedModals(props: CollectionTabOptions): React.ReactElement[];
  // TODO(COMPASS-7405): Remove usage of `renderTabs` for Query.QueryBar role
  renderTabs(
    props: CollectionTabOptions
  ): { name: string; component: React.ReactElement }[];
  onTabClick(name: string): void;
};

const CollectionTab: React.FunctionComponent<CollectionTabProps> = ({
  namespace,
  currentTab,
  initialAggregation,
  initialPipeline,
  initialPipelineText,
  initialQuery,
  editViewName,
  collectionMetadata,
  renderScopedModals,
  renderTabs,
  onTabClick,
}) => {
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
  const pluginTabs = useCollectionTabPlugins();

  if (collectionMetadata === null) {
    return null;
  }

  const tabsProps = {
    namespace,
    initialAggregation,
    initialPipeline,
    initialPipelineText,
    initialQuery,
    editViewName,
  };
  renderTabs(tabsProps); // TODO(COMPASS-7405): Remove usage for Query.QueryBar role
  const tabs = pluginTabs.map(({ name, component: Component }) => ({
    name,
    component: (
      <Component
        {...collectionMetadata}
        namespace={namespace}
        aggregation={initialAggregation}
        pipeline={initialPipeline}
        pipelineText={initialPipelineText}
        query={initialQuery}
        editViewName={editViewName}
      />
    ),
  }));
  const activeTabIndex = tabs.findIndex((tab) => tab.name === currentTab);

  return (
    <div className={collectionStyles} data-testid="collection">
      <div className={collectionContainerStyles}>
        <ConnectedCollectionHeader
          editViewName={editViewName}
          {...collectionMetadata}
        ></ConnectedCollectionHeader>
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
        {renderScopedModals(tabsProps)}
      </div>
    </div>
  );
};

const ConnectedCollectionTab = connect(
  (state: CollectionState) => {
    return {
      namespace: state.namespace,
      currentTab: state.currentTab,
      collectionMetadata: state.metadata,
    };
  },
  {
    renderScopedModals: renderScopedModals,
    renderTabs: renderTabs,
    onTabClick: selectTab,
  }
)(CollectionTab) as React.FunctionComponent<CollectionTabOptions>;

export default ConnectedCollectionTab;
