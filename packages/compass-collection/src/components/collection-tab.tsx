import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { type CollectionState, selectTab } from '../modules/collection-tab';
import {
  css,
  ErrorBoundary,
  spacing,
  TabNavBar,
} from '@mongodb-js/compass-components';
import CollectionHeader from './collection-header';
import { useLogger } from '@mongodb-js/compass-logging/provider';
import {
  useCollectionQueryBar,
  useCollectionScopedModals,
  useCollectionSubTabs,
} from './collection-tab-provider';
import type { CollectionTabOptions } from '../stores/collection-tab';
import type { CollectionMetadata } from 'mongodb-collection-model';
import {
  CollectionDocumentsStats,
  CollectionIndexesStats,
} from './collection-tab-stats';
import type { CollectionSubtab } from '@mongodb-js/compass-workspaces';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { useConnectionInfoAccess } from '@mongodb-js/compass-connections/provider';

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

const tabTitleWithStatsStyles = css({
  display: 'flex',
  gap: spacing[2],
});
const TabTitleWithStats = ({
  title,
  statsComponent,
  'data-testid': dataTestId,
}: {
  title: string;
  statsComponent: React.ReactNode;
  'data-testid'?: string;
}) => {
  return (
    <div data-testid={dataTestId} className={tabTitleWithStatsStyles}>
      {title}
      {statsComponent}
    </div>
  );
};

// Props from redux
type ConnectionTabConnectedProps = {
  collectionMetadata: CollectionMetadata;
  stats: CollectionState['stats'];
  onTabClick: (tab: CollectionSubtab) => void;
};

// TODO(COMPASS-7937): Wrong place for these types and type descriptions
// Props definition when using the component
type ConnectionTabExpectedProps = {
  /**
   * Initial query to be set in the query bar
   */
  initialQuery?: unknown;
  /**
   * Initial saved sggregation (stored on disk) to apply to the agg builder
   */
  initialAggregation?: unknown;
  /**
   * Initial aggregation pipeline to set in the agg builder
   */
  initialPipeline?: unknown[];
  /**
   * Initial stringified aggregation pipeline to set in the agg builder
   */
  initialPipelineText?: string;
  /**
   * Name of the tab being edited
   */
  subTab: CollectionSubtab;
};

// All props available to the component
type CollectionTabProps = Omit<CollectionTabOptions, 'tabId'> &
  ConnectionTabConnectedProps &
  ConnectionTabExpectedProps;

const CollectionTabWithMetadata: React.FunctionComponent<
  CollectionTabProps
> = ({
  namespace,
  initialAggregation,
  initialPipeline,
  initialPipelineText,
  initialQuery,
  editViewName,
  collectionMetadata,
  subTab: currentTab,
  onTabClick,
  stats,
}) => {
  const track = useTelemetry();
  const connectionInfoAccess = useConnectionInfoAccess();
  const { log, mongoLogId } = useLogger('COMPASS-COLLECTION-TAB-UI');
  useEffect(() => {
    const activeSubTabName = currentTab
      ? trackingIdForTabName(currentTab)
      : null;

    if (activeSubTabName) {
      track(
        'Screen',
        {
          name: activeSubTabName,
        },
        connectionInfoAccess.getCurrentConnectionInfo()
      );
    }
  }, [currentTab, track, connectionInfoAccess]);
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
    <div className={collectionStyles} data-testid="collection">
      <div className={collectionContainerStyles}>
        <CollectionHeader
          editViewName={editViewName}
          {...collectionMetadata}
        ></CollectionHeader>
        <TabNavBar
          data-testid="collection-tabs"
          aria-label="Collection Tabs"
          tabNames={tabs.map((tab) => tab.name)}
          tabLabels={tabs.map((tab) => {
            // We don't show stats, when the collection is a timeseries or a view
            // or when the view is being edited
            const hideStats =
              collectionMetadata.isTimeSeries ||
              collectionMetadata.sourceName ||
              editViewName;
            if (hideStats) {
              return tab.name;
            }
            if (tab.name === 'Documents') {
              return (
                <TabTitleWithStats
                  data-testid="documents-tab-with-stats"
                  title={tab.name}
                  statsComponent={<CollectionDocumentsStats stats={stats} />}
                />
              );
            }
            if (tab.name === 'Indexes') {
              return (
                <TabTitleWithStats
                  data-testid="indexes-tab-with-stats"
                  title={tab.name}
                  statsComponent={<CollectionIndexesStats stats={stats} />}
                />
              );
            }
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
  );
};

const CollectionTab = ({
  collectionMetadata,
  ...props
}: Omit<CollectionTabProps, 'collectionMetadata'> & {
  collectionMetadata: CollectionMetadata | null;
}) => {
  const QueryBarPlugin = useCollectionQueryBar();

  if (!collectionMetadata) {
    return null;
  }

  const pluginProps = {
    ...collectionMetadata,
    namespace: props.namespace,
    aggregation: props.initialAggregation,
    pipeline: props.initialPipeline,
    pipelineText: props.initialPipelineText,
    query: props.initialQuery,
    editViewName: props.editViewName,
  };

  return (
    <QueryBarPlugin {...pluginProps}>
      <CollectionTabWithMetadata
        collectionMetadata={collectionMetadata}
        {...props}
      ></CollectionTabWithMetadata>
    </QueryBarPlugin>
  );
};

const ConnectedCollectionTab = connect(
  (state: CollectionState) => {
    return {
      namespace: state.namespace,
      collectionMetadata: state.metadata,
      stats: state.stats,
    };
  },
  {
    onTabClick: selectTab,
  }
)(CollectionTab) as React.FunctionComponent<
  CollectionTabOptions & ConnectionTabExpectedProps
>;

export default ConnectedCollectionTab;
