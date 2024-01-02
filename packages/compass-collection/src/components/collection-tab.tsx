import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { type CollectionState, selectTab } from '../modules/collection-tab';
import { css, ErrorBoundary, TabNavBar } from '@mongodb-js/compass-components';
import CollectionHeader from './collection-header';
import { useLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import {
  useCollectionQueryBar,
  useCollectionScopedModals,
  useCollectionSubTabs,
} from './collection-tab-provider';
import type { CollectionTabOptions } from '../stores/collection-tab';
import type { CollectionMetadata } from 'mongodb-collection-model';

function trackingIdForTabName(name: string) {
  return name.toLowerCase().replace(/ /g, '_');
}

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
  collectionMetadata: CollectionMetadata;
  onTabClick(name: string): void;
};

const CollectionTabWithMetadata: React.FunctionComponent<
  CollectionTabProps
> = ({
  namespace,
  currentTab,
  initialAggregation,
  initialPipeline,
  initialPipelineText,
  initialQuery,
  editViewName,
  collectionMetadata,
  onTabClick,
}) => {
  const { log, mongoLogId, track } = useLoggerAndTelemetry(
    'COMPASS-COLLECTION-TAB-UI'
  );
  useEffect(() => {
    const activeSubTabName = currentTab
      ? trackingIdForTabName(currentTab)
      : null;

    if (activeSubTabName) {
      track('Screen', {
        name: activeSubTabName,
      });
    }
  }, [currentTab, track]);

  const QueryBarPlugin = useCollectionQueryBar();
  const pluginTabs = useCollectionSubTabs();
  const pluginModals = useCollectionScopedModals();

  const pluginProps = {
    ...collectionMetadata,
    namespace: namespace,
    aggregation: initialAggregation,
    pipeline: initialPipeline,
    pipelineText: initialPipelineText,
    query: initialQuery,
    editViewName: editViewName,
  };

  const tabs = pluginTabs.map(({ name, component: Component }) => {
    // `pluginTabs` never change in runtime so it's safe to call the hook here
    // eslint-disable-next-line react-hooks/rules-of-hooks
    Component.useActivate(pluginProps);

    return {
      name,
      component: <Component {...pluginProps} />,
    };
  });
  const activeTabIndex = tabs.findIndex((tab) => tab.name === currentTab);

  return (
    <QueryBarPlugin {...pluginProps}>
      <div className={collectionStyles} data-testid="collection">
        <div className={collectionContainerStyles}>
          <CollectionHeader
            editViewName={editViewName}
            {...collectionMetadata}
          ></CollectionHeader>
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
          {pluginModals.map((ModalPlugin, idx) => {
            return <ModalPlugin key={idx} {...pluginProps}></ModalPlugin>;
          })}
        </div>
      </div>
    </QueryBarPlugin>
  );
};

const CollectionTab = ({
  collectionMetadata,
  ...props
}: Omit<CollectionTabProps, 'collectionMetadata'> & {
  collectionMetadata: CollectionMetadata | null;
}) => {
  if (!collectionMetadata) {
    return null;
  }

  return (
    <CollectionTabWithMetadata
      collectionMetadata={collectionMetadata}
      {...props}
    ></CollectionTabWithMetadata>
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
    onTabClick: selectTab,
  }
)(CollectionTab) as React.FunctionComponent<CollectionTabOptions>;

export default ConnectedCollectionTab;
